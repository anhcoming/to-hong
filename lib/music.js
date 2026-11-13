// Nhạc mẫu cho thiệp: bản thu miễn phí bản quyền (phạm vi công cộng / CC0) lấy từ Wikimedia Commons,
// đã cắt gọn + nén MP3 sẵn trong public/music. Thiệp chưa chọn nhạc (và chưa tắt nhạc) tự dùng bản hợp với nhóm mẫu.
// Thêm bản mới: tải bản thu có giấy phép Public domain/CC0, chạy tools/music.sh để nén, rồi thêm một dòng vào TRACKS.
const TRACKS = require('../public/music/tracks.json');

// nhóm mẫu thiệp (lib/render.js → groups) → bản nhạc mặc định
const BY_GROUP = {
  truyenthong: 'canon',
  hoanggia: 'wedding-march',
  toigian: 'canon',
  hoa: 'air',
  minhhoa: 'gymnopedie',
  chatlieu: 'clair-de-lune',
};
const byId = Object.fromEntries(TRACKS.map((t) => [t.id, t]));
const file = (t) => `/music/${t.id}.mp3`;

function defaultFor(group) {
  const t = byId[BY_GROUP[group]] || TRACKS[0];
  return t ? file(t) : '';
}
// nhạc thiệp thật sự phát: bản đã chọn / tải lên; chưa có thì bản tự chọn theo mẫu; đã tắt nhạc thì không có
function effective(data, group) {
  if (data.music) return data.music;
  return data.musicOff ? '' : defaultFor(group);
}
function options() {
  return { tracks: TRACKS.map((t) => ({ ...t, file: file(t) })), byGroup: Object.fromEntries(Object.entries(BY_GROUP).map(([g, id]) => [g, byId[id] ? file(byId[id]) : ''])) };
}

module.exports = { TRACKS, defaultFor, effective, options };
