// API sổ tay cưới: đám cưới, thành viên, việc cần làm, ngân sách, khách mời.
const { db, save } = require('./db');
const { json, send, readJson, httpError, str } = require('./util');
const W = require('./wedding');
const G = require('./guests');

module.exports = function plannerRoutes({ route, needUser, rateLimit, cardSummary, BASE_URL }) {
  const DAY = 864e5;

  function myWedding(ctx) {
    return W.ensure(needUser(ctx));
  }
  function owned(ctx, coll, id, label) {
    const w = myWedding(ctx);
    const x = db[coll].find((i) => i.id === id && i.weddingId === w.id);
    if (!x) throw httpError(404, `Không tìm thấy ${label}`);
    return x;
  }

  function memberView(w) {
    return w.members.map((m) => {
      const u = db.users.find((x) => x.id === m.userId) || {};
      return { userId: m.userId, name: u.name || '', email: u.email || '', role: m.role };
    });
  }
  function overview(w, user) {
    const tasks = db.tasks.filter((t) => t.weddingId === w.id);
    const budget = db.budget.filter((b) => b.weddingId === w.id);
    const sum = (f) => budget.reduce((n, b) => n + f(b), 0);
    return {
      wedding: {
        id: w.id, name: w.name, region: w.region, date: w.date, time: w.time, budgetTotal: w.budgetTotal, couple: w.couple, createdAt: w.createdAt,
        isOwner: w.members.some((m) => m.userId === user.id && m.role === 'owner'),
      },
      members: memberView(w),
      stats: {
        tasks: tasks.length, tasksDone: tasks.filter((t) => t.done).length,
        estimate: sum((b) => b.estimate), actual: sum((b) => b.actual), paid: sum((b) => b.paid),
        guests: G.stats(w.id),
      },
      cards: db.cards.filter((c) => c.weddingId === w.id).sort((a, b) => b.updatedAt - a.updatedAt).map(cardSummary),
      regions: W.REGIONS, taskCats: W.TASK_CATS, budgetCats: W.BUDGET_CATS,
    };
  }

  // ---------- đám cưới ----------
  route('GET', '/api/wedding', async (req, res, ctx) => {
    const w = myWedding(ctx);
    json(res, 200, overview(w, ctx.user));
  });

  route('PUT', '/api/wedding', async (req, res, ctx) => {
    const w = myWedding(ctx);
    const b = await readJson(req);
    if (b.region && b.region !== w.region) W.reseed(w, b.region);
    W.update(w, b);
    json(res, 200, overview(w, ctx.user));
  });

  // ---------- thành viên: mời người yêu, bố mẹ cùng sửa ----------
  route('GET', '/api/wedding/invite', async (req, res, ctx) => {
    const w = myWedding(ctx);
    json(res, 200, { url: `${BASE_URL}/tham-gia/${w.inviteCode}` });
  });
  route('POST', '/api/wedding/invite/reset', async (req, res, ctx) => {
    const w = myWedding(ctx);
    if (!w.members.some((m) => m.userId === ctx.user.id && m.role === 'owner')) throw httpError(403, 'Chỉ người tạo sổ tay đổi được link mời');
    w.inviteCode = require('./util').rid(16);
    save();
    json(res, 200, { url: `${BASE_URL}/tham-gia/${w.inviteCode}` });
  });
  route('GET', '/api/join/:code', async (req, res, ctx) => {
    const w = db.weddings.find((x) => x.inviteCode === ctx.params.code);
    if (!w) throw httpError(404, 'Link mời không còn hiệu lực');
    const c = w.couple;
    json(res, 200, { names: [c.groom.name, c.bride.name].filter(Boolean).join(' & '), date: w.date, member: W.isMember(w, ctx.user) });
  });
  route('POST', '/api/join/:code', async (req, res, ctx) => {
    const user = needUser(ctx);
    rateLimit('join:' + user.id, 20, 36e5);
    const w = db.weddings.find((x) => x.inviteCode === ctx.params.code);
    if (!w) throw httpError(404, 'Link mời không còn hiệu lực');
    if (!W.isMember(w, user)) {
      if (w.members.length >= 10) throw httpError(400, 'Sổ tay đã đủ 10 thành viên');
      w.members.push({ userId: user.id, role: 'editor', joinedAt: Date.now() });
    }
    user.weddingId = w.id;
    save();
    json(res, 200, { ok: true });
  });
  route('DELETE', '/api/wedding/members/:uid', async (req, res, ctx) => {
    const w = myWedding(ctx);
    const me = ctx.user.id;
    const target = ctx.params.uid;
    const isOwner = w.members.some((m) => m.userId === me && m.role === 'owner');
    if (target !== me && !isOwner) throw httpError(403, 'Chỉ người tạo sổ tay mới xoá được thành viên');
    const m = w.members.find((x) => x.userId === target);
    if (!m) throw httpError(404, 'Không có thành viên này');
    if (m.role === 'owner') throw httpError(400, 'Không thể xoá người tạo sổ tay');
    w.members = w.members.filter((x) => x.userId !== target);
    const u = db.users.find((x) => x.id === target);
    if (u && u.weddingId === w.id) u.weddingId = null; // lần sau vào sẽ có sổ tay riêng
    save();
    json(res, 200, { ok: true });
  });

  // ---------- việc cần làm ----------
  function taskView(t, w) {
    let due = null;
    if (w.date) {
      const d = new Date(w.date + 'T00:00:00Z');
      due = new Date(d.getTime() + t.offset * DAY).toISOString().slice(0, 10);
    }
    return { ...t, due };
  }
  route('GET', '/api/wedding/tasks', async (req, res, ctx) => {
    const w = myWedding(ctx);
    const tasks = db.tasks.filter((t) => t.weddingId === w.id).sort((a, b) => a.offset - b.offset || a.createdAt - b.createdAt).map((t) => taskView(t, w));
    json(res, 200, { tasks });
  });
  function cleanTask(b, prev = {}) {
    const o = {};
    if (b.title !== undefined) { o.title = str(b.title, 140); if (!o.title) throw httpError(400, 'Tên việc không được để trống'); }
    if (b.category !== undefined) o.category = str(b.category, 40) || 'Khác';
    if (b.offset !== undefined) o.offset = Math.max(-1000, Math.min(400, parseInt(b.offset, 10) || 0));
    if (b.note !== undefined) o.note = str(b.note, 500);
    if (b.done !== undefined) { o.done = !!b.done; o.doneAt = o.done ? (prev.doneAt || Date.now()) : null; }
    return o;
  }
  route('POST', '/api/wedding/tasks', async (req, res, ctx) => {
    const w = myWedding(ctx);
    const b = await readJson(req);
    if (db.tasks.filter((t) => t.weddingId === w.id).length >= 300) throw httpError(400, 'Quá nhiều việc');
    const t = {
      id: require('./util').rid(12), weddingId: w.id, title: '', category: 'Khác', offset: -30, cta: null,
      done: false, doneAt: null, assignee: null, note: '', custom: true, createdAt: Date.now(), ...cleanTask({ title: '', ...b }),
    };
    db.tasks.push(t);
    save();
    json(res, 200, { task: taskView(t, w) });
  });
  route('PUT', '/api/tasks/:id', async (req, res, ctx) => {
    const t = owned(ctx, 'tasks', ctx.params.id, 'việc');
    const w = W.get(t.weddingId);
    const b = await readJson(req);
    Object.assign(t, cleanTask(b, t));
    if (b.assignee !== undefined) t.assignee = b.assignee && w.members.some((m) => m.userId === b.assignee) ? b.assignee : null;
    save();
    json(res, 200, { task: taskView(t, w) });
  });
  route('DELETE', '/api/tasks/:id', async (req, res, ctx) => {
    const t = owned(ctx, 'tasks', ctx.params.id, 'việc');
    db.tasks.splice(db.tasks.indexOf(t), 1);
    save();
    json(res, 200, { ok: true });
  });

  // ---------- ngân sách ----------
  function cleanItem(b) {
    const o = {};
    if (b.name !== undefined) { o.name = str(b.name, 100); if (!o.name) throw httpError(400, 'Tên khoản chi không được để trống'); }
    if (b.category !== undefined) o.category = str(b.category, 40) || 'Khác';
    ['estimate', 'actual', 'paid'].forEach((k) => { if (b[k] !== undefined) o[k] = W.money(b[k]); });
    if (b.note !== undefined) o.note = str(b.note, 300);
    return o;
  }
  route('GET', '/api/wedding/budget', async (req, res, ctx) => {
    const w = myWedding(ctx);
    json(res, 200, { items: db.budget.filter((x) => x.weddingId === w.id).sort((a, b) => a.createdAt - b.createdAt), total: w.budgetTotal, gifts: G.stats(w.id).gifts });
  });
  route('POST', '/api/wedding/budget', async (req, res, ctx) => {
    const w = myWedding(ctx);
    if (db.budget.filter((x) => x.weddingId === w.id).length >= 300) throw httpError(400, 'Quá nhiều khoản chi');
    const b = await readJson(req);
    const item = { id: require('./util').rid(12), weddingId: w.id, category: 'Khác', name: '', estimate: 0, actual: 0, paid: 0, note: '', createdAt: Date.now(), ...cleanItem({ name: '', ...b }) };
    db.budget.push(item);
    save();
    json(res, 200, { item });
  });
  route('PUT', '/api/budget/:id', async (req, res, ctx) => {
    const item = owned(ctx, 'budget', ctx.params.id, 'khoản chi');
    Object.assign(item, cleanItem(await readJson(req)));
    save();
    json(res, 200, { item });
  });
  route('DELETE', '/api/budget/:id', async (req, res, ctx) => {
    const item = owned(ctx, 'budget', ctx.params.id, 'khoản chi');
    db.budget.splice(db.budget.indexOf(item), 1);
    save();
    json(res, 200, { ok: true });
  });

  // ---------- khách mời ----------
  route('GET', '/api/wedding/guests', async (req, res, ctx) => {
    const w = myWedding(ctx);
    json(res, 200, { guests: G.list(w.id), stats: G.stats(w.id) });
  });
  route('POST', '/api/wedding/guests', async (req, res, ctx) => {
    const w = myWedding(ctx);
    const b = await readJson(req, 1e6);
    const added = b.names !== undefined ? G.addNames(w.id, b.names, G.clean(b)) : G.add(w.id, [b]);
    json(res, 200, { added: added.length });
  });
  route('PUT', '/api/guests/:id', async (req, res, ctx) => {
    const g = owned(ctx, 'guests', ctx.params.id, 'khách');
    const b = await readJson(req);
    Object.assign(g, G.clean(b, g));
    if (!g.name) throw httpError(400, 'Tên khách không được để trống');
    if (b.rsvp !== undefined) g.rsvp = b.rsvp === 'yes' || b.rsvp === 'no' ? { attending: b.rsvp, count: g.count, note: '', at: Date.now(), manual: true } : null;
    save();
    json(res, 200, { guest: g });
  });
  route('GET', '/api/wedding/guests.csv', async (req, res, ctx) => {
    const w = myWedding(ctx);
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Tên', 'Khách nhà', 'Nhóm', 'Số người', 'Đã mời', 'Xác nhận', 'Tiền mừng', 'Ghi chú'].map(q).join(',')];
    G.list(w.id).forEach((g) => rows.push([g.name, g.side === 'trai' ? 'Trai' : g.side === 'gai' ? 'Gái' : '', g.group, g.count, g.invited ? 'Có' : '',
      g.rsvp ? (g.rsvp.attending === 'yes' ? 'Đến' : 'Không đến') : '', g.gift || '', g.note].map(q).join(',')));
    send(res, 200, '﻿' + rows.join('\r\n'), { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="danh-sach-khach.csv"' });
  });
};
