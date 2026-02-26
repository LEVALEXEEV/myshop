export default function setScrollbarWidth() {
  const s = document.createElement('div');
  s.style.cssText =
    'width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px;';
  document.body.appendChild(s);
  const sbw = s.offsetWidth - s.clientWidth;
  document.body.removeChild(s);
  document.documentElement.style.setProperty('--sbw', `${sbw}px`);
}
