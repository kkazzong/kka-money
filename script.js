const salaryInput = document.querySelector('#salary');
const daysInput = document.querySelector('#days');
const startTimeInput = document.querySelector('#startTime');
const endTimeInput = document.querySelector('#endTime');
const earnedToday = document.querySelector('#earnedToday');
const perMinute = document.querySelector('#perMinute');
const progressBar = document.querySelector('#progressBar');
const elapsedText = document.querySelector('#elapsedText');
const startButton = document.querySelector('#startButton');
const saveButton = document.querySelector('#saveButton');
const speechBubble = document.querySelector('#speechBubble');
const statusText = document.querySelector('#statusText');

let startedAt = null;
let timer = null;
const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });
const number = (value) => Math.max(0, Number(String(value).replace(/,/g, '')) || 0);
const settings = () => {
  const start = startTimeInput.value || '09:00';
  const end = endTimeInput.value || '18:00';
  let startMinutes = timeToMinutes(start); let endMinutes = timeToMinutes(end);
  let workMinutes = endMinutes - startMinutes;
  if (workMinutes <= 0) workMinutes += 24 * 60;
  return { salary: number(salaryInput.value), days: Math.max(1, number(daysInput.value)), start, end, startMinutes, endMinutes, workMinutes };
};
const timeToMinutes = (value) => { const [hours, minutes] = value.split(':').map(Number); return (hours * 60) + minutes; };
const calculate = () => { const s = settings(); const minute = s.salary / s.days / s.workMinutes; return { ...s, minute, day: s.salary / s.days }; };
const formatSalary = () => {
  const digits = salaryInput.value.replace(/[^0-9]/g, '');
  salaryInput.value = digits ? Number(digits).toLocaleString('ko-KR') : '';
};
const elapsedWorkSeconds = (now, startMinutes, endMinutes, workMinutes) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  let elapsed;
  if (startMinutes < endMinutes) {
    elapsed = currentMinutes < startMinutes ? 0 : currentMinutes - startMinutes;
  } else {
    const isOvernightWork = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    elapsed = isOvernightWork ? (currentMinutes >= startMinutes ? currentMinutes - startMinutes : currentMinutes + 1440 - startMinutes) : 0;
  }
  return Math.min(Math.max(elapsed * 60, 0), workMinutes * 60);
};
const render = () => {
  const { minute, day, workMinutes, startMinutes, endMinutes } = calculate();
  perMinute.textContent = won.format(minute);
  if (!startedAt) { earnedToday.textContent = won.format(0); progressBar.style.width = '0%'; elapsedText.textContent = '머니봇을 깨우면 현재 시각 기준으로 계산해요'; return; }
  const elapsedSeconds = elapsedWorkSeconds(new Date(), startMinutes, endMinutes, workMinutes);
  const earned = Math.min(day, minute * elapsedSeconds / 60);
  earnedToday.textContent = won.format(earned);
  progressBar.style.width = `${Math.min(100, (elapsedSeconds / (workMinutes * 60)) * 100)}%`;
  const mins = Math.floor(elapsedSeconds / 60); const secs = Math.floor(elapsedSeconds % 60);
  elapsedText.textContent = `${mins}분 ${String(secs).padStart(2, '0')}초째 세는 중 · 오늘 목표의 ${Math.min(100, Math.round((earned / day) * 100))}%`;
};
startButton.addEventListener('click', () => {
  if (startedAt) { startedAt = null; clearInterval(timer); timer = null; startButton.innerHTML = '머니봇 깨우기 <span>✦</span>'; statusText.textContent = '잠깐 쉬는 중'; speechBubble.innerHTML = '잠깐<br /><strong>충전할게!</strong>'; }
  else { startedAt = Date.now(); timer = setInterval(render, 1000); startButton.innerHTML = '머니봇 잠재우기 <span>☾</span>'; statusText.textContent = '오늘도 열일 중'; speechBubble.innerHTML = '돈이<br /><strong>쌓이는 중!</strong>'; }
  render();
});
saveButton.addEventListener('click', () => { render(); saveButton.innerHTML = '저장했어요 <span>✓</span>'; setTimeout(() => { saveButton.innerHTML = '설정 저장하기 <span>→</span>'; }, 1800); });
[salaryInput, daysInput, startTimeInput, endTimeInput].forEach((input) => input.addEventListener('input', render));
salaryInput.addEventListener('input', formatSalary);
salaryInput.addEventListener('blur', formatSalary);
formatSalary();
render();
