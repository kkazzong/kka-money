const salaryInput = document.querySelector('#salary');
const botNameInput = document.querySelector('#botName');
const botNameText = document.querySelector('#botNameText');
const botName = () => {
  const name = botNameInput.value.trim();
  return name ? (name.endsWith('봇') ? name : `${name}봇`) : '머니봇';
};
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
const robotStage = document.querySelector('.robot-stage');
const coinFill = document.querySelector('#coinFill');
const coinPercent = document.querySelector('#coinPercent');
const coinReserve = document.querySelector('#coinReserve');

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
  const name = botName();
  botNameText.textContent = name;
  startButton.textContent = `${name} ${startedAt ? '잠재우기' : '깨우기'} `;
  const icon = document.createElement('span');
  icon.textContent = startedAt ? '☾' : '✦';
  startButton.append(icon);
  robotStage.setAttribute('aria-label', `${startedAt ? '깨어 있는' : '잠자는'} ${name}`);
  const { minute, day, workMinutes, startMinutes, endMinutes } = calculate();
  perMinute.textContent = won.format(minute);
  const elapsedSeconds = startedAt ? elapsedWorkSeconds(new Date(), startMinutes, endMinutes, workMinutes) : 0;
  const elapsedMinutes = elapsedSeconds / 60;
  const completedMinutes = elapsedMinutes >= workMinutes ? workMinutes : Math.floor(elapsedMinutes / 60) * 60;
  const percent = Math.min(100, Math.round(completedMinutes / workMinutes * 100));
  coinFill.style.height = `${percent}%`;
  coinPercent.textContent = `${percent}%`;
  coinReserve.setAttribute('aria-valuenow', String(percent));
  const earned = Math.min(day, minute * completedMinutes);
  earnedToday.textContent = won.format(earned);
  progressBar.style.width = `${percent}%`;
  const hours = Math.floor(completedMinutes / 60);
  const remainingMinutes = completedMinutes % 60;
  elapsedText.textContent = startedAt
    ? `${hours}시간${remainingMinutes ? ` ${remainingMinutes}분` : ''} 근무 완료 · 오늘 목표의 ${percent}%`
    : `${name}을 깨우면 1시간 단위로 코인이 쌓여요`;
};
startButton.addEventListener('click', () => {
  if (startedAt) { startedAt = null; clearInterval(timer); timer = null; }
  else { startedAt = Date.now(); timer = setInterval(render, 60000); statusText.textContent = '오늘도 열일 중'; speechBubble.innerHTML = '코인이<br /><strong>쌓이는 중!</strong>'; }
  robotStage.classList.toggle('is-sleeping', !startedAt);
  if (!startedAt) {
    statusText.textContent = '새근새근 꿈나라';
    speechBubble.innerHTML = '새근새근<br /><strong>꿈에서도 차곡차곡…</strong>';
  }
  render();
});
saveButton.addEventListener('click', () => { render(); saveButton.innerHTML = '저장했어요 <span>✓</span>'; setTimeout(() => { saveButton.innerHTML = '설정 저장하기 <span>→</span>'; }, 1800); });
[botNameInput, salaryInput, daysInput, startTimeInput, endTimeInput].forEach((input) => input.addEventListener('input', render));
salaryInput.addEventListener('input', formatSalary);
salaryInput.addEventListener('blur', formatSalary);
formatSalary();
render();
