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
const resetButton = document.querySelector('#resetButton');
const storageStatus = document.querySelector('#storageStatus');
const speechBubble = document.querySelector('#speechBubble');
const statusText = document.querySelector('#statusText');
const robotStage = document.querySelector('.robot-stage');
const coinFill = document.querySelector('#coinFill');
const coinPercent = document.querySelector('#coinPercent');
const coinReserve = document.querySelector('#coinReserve');

let startedAt = null;
let timer = null;
const storageKey = 'kka-money.settings.v1';
const settingInputs = [botNameInput, salaryInput, daysInput, startTimeInput, endTimeInput];
const defaultValues = settingInputs.map((input) => input.value);
const saveSettings = () => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(settingInputs.map((input) => [input.id, input.value]))));
    storageStatus.textContent = '입력한 정보는 이 브라우저에 자동 저장돼요.';
    return true;
  } catch {
    storageStatus.textContent = '브라우저 저장소를 사용할 수 없어 정보를 저장하지 못했어요.';
    return false;
  }
};
const restoreSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
    settingInputs.forEach((input) => {
      if (typeof saved[input.id] === 'string') input.value = saved[input.id];
    });
  } catch {
    storageStatus.textContent = '저장된 정보를 불러오지 못했어요. 다시 입력해 주세요.';
  }
};
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
saveButton.addEventListener('click', () => {
  formatSalary();
  render();
  saveButton.textContent = saveSettings() ? '저장했어요 ✓' : '저장하지 못했어요';
  setTimeout(() => { saveButton.innerHTML = '저장할래요 <span>→</span>'; }, 1800);
});
resetButton.addEventListener('click', () => {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    storageStatus.textContent = '저장된 정보를 지우지 못했어요. 브라우저 저장소 설정을 확인해 주세요.';
    return;
  }
  settingInputs.forEach((input, index) => { input.value = defaultValues[index]; });
  if (startedAt) startButton.click();
  formatSalary();
  render();
  storageStatus.textContent = '저장된 정보를 지우고 기본값으로 초기화했어요.';
});
settingInputs.forEach((input) => input.addEventListener('input', () => {
  if (input === salaryInput) formatSalary();
  render();
  saveSettings();
}));
salaryInput.addEventListener('blur', formatSalary);
restoreSettings();
formatSalary();
render();
