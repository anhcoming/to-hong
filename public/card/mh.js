// Tương tác cho mẫu canvas nhập từ mehappy (lib/mh.js): cuộn tới khối, mở popup, hộp ảnh, ẩn/hiện, menu nhanh, video, gợi ý lời chúc.
(function () {
  'use strict';
  var lb = document.getElementById('lightbox');
  function openLb(src) { if (!lb || !src) return; lb.querySelector('img').src = src; lb.hidden = false; }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-mh]');
    if (!el) return;
    var k = el.getAttribute('data-mh');
    if (k === 'nav') { var t = document.getElementById(el.getAttribute('data-to')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (k === 'popup') { var d = document.getElementById(el.getAttribute('data-to')); if (d && d.showModal) d.showModal(); }
    else if (k === 'close') { var dl = el.closest('dialog'); if (dl) dl.close(); }
    else if (k === 'lb') openLb(el.getAttribute('data-src') || (el.querySelector('img') || {}).src);
    else if (k === 'album') { var first = document.querySelector('.ph[data-i]'); if (first) first.click(); else openLb((window.__CARD && window.__CARD.photos || [])[0]); }
    else if (k === 'open') { var b = document.getElementById('openBtn'); if (b) b.click(); }
    else if (k === 'toggle') {
      (el.getAttribute('data-show') || '').split(',').forEach(function (id) { var x = id && (document.getElementById('mh-' + id) || document.getElementById(id)); if (x) x.style.display = ''; });
      (el.getAttribute('data-hide') || '').split(',').forEach(function (id) { var x = id && (document.getElementById('mh-' + id) || document.getElementById(id)); if (x) x.style.display = 'none'; });
    }
    else if (k === 'qa') { var qa = el.closest('.mh-qa'); if (qa) qa.classList.toggle('open'); }
    else if (k === 'yt') { el.innerHTML = '<iframe src="https://www.youtube.com/embed/' + el.getAttribute('data-id') + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>'; el.removeAttribute('data-mh'); }
    else if (k === 'sug') { var ta = el.closest('form').querySelector('textarea'); if (ta) { ta.value = el.textContent; ta.focus(); } }
  });
  // bấm nền tối của popup thì đóng
  document.querySelectorAll('dialog.mh-pop').forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); });
})();
