// Chạy trên bản CLONE (/demo/<id>): mở thiệp, tắt hiệu ứng hiện dần và cuộn mượt để đo được giá trị cuối cùng.
// Dùng: dán file, rồi `await __prepClone()`. Gọi lại sau mỗi lần tải lại trang.
window.__prepClone = async () => {
  await new Promise((r) => setTimeout(r, 600));
  const btn = document.getElementById('openBtn');
  if (btn && document.getElementById('opener')) btn.click();
  document.documentElement.style.scrollBehavior = 'auto';
  document.querySelectorAll('.reveal').forEach((e) => { e.style.transition = 'none'; e.classList.add('in'); });
  await new Promise((r) => setTimeout(r, 1000)); // màn mở thiệp mờ dần ~0.8s
  scrollTo(0, 0);
  return { vw: innerWidth, opened: !document.getElementById('opener') };
};
