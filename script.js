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
const rateLabel = document.querySelector('#rateLabel');
const coinCaption = document.querySelector('#coinCaption');
const unitInputs = [...document.querySelectorAll('input[name="earningUnit"]')];
const earningUnits = {
  second: { seconds: 1, label: '초당', interval: '1초' },
  minute: { seconds: 60, label: '분당', interval: '1분' },
  hour: { seconds: 3600, label: '시간당', interval: '1시간' },
};
let earningUnit = 'hour';
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
    localStorage.setItem(storageKey, JSON.stringify({ ...Object.fromEntries(settingInputs.map((input) => [input.id, input.value])), earningUnit }));
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
    if (Object.hasOwn(earningUnits, saved.earningUnit)) earningUnit = saved.earningUnit;
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
const creditedSeconds = (elapsedSeconds, workSeconds, unitSeconds) => {
  const bounded = Math.min(workSeconds, Math.max(0, elapsedSeconds));
  return bounded >= workSeconds ? workSeconds : Math.floor((bounded + 1e-7) / unitSeconds) * unitSeconds;
};
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
const workMood = (elapsedMinutes, workMinutes, beforeWork) => {
  if (!startedAt) return { state: 'sleeping', status: '새근새근 꿈나라', message: '새근새근<br /><strong>꿈에서도 차곡차곡…</strong>' };
  if (beforeWork) return { state: 'sleepy', status: '출근 준비 중', message: '아직 이불이 좋은데…<br /><strong>출근 준비는 꼬물꼬물!</strong>' };
  if (elapsedMinutes >= workMinutes) return { state: 'home', status: '오늘도 수고했어요', message: '오늘의 나, 제법 멋졌어!<br /><strong>이제 집으로 총총 ♡</strong>' };
  if (workMinutes - elapsedMinutes <= 60) return { state: 'excited', status: '퇴근 생각에 두근두근', message: '마음은 벌써 현관 앞!<br /><strong>집아, 조금만 기다려 ♡</strong>' };
  if (elapsedMinutes < 60) return { state: 'sleepy', status: '아직은 졸려요', message: '하아암… 눈 비비고<br /><strong>오늘도 출근 도장 꾹!</strong>' };
  if (elapsedMinutes < 120) return { state: 'coffee', status: '커피 충전 중', message: '커피 한 모금, 꼴깍 ☕<br /><strong>이제 눈이 좀 떠진다!</strong>' };
  if (elapsedMinutes < 180) return { state: 'lunch', status: '점심 메뉴 고민 중', message: '머릿속엔 메뉴판이 둥둥…<br /><strong>오늘 점심 뭐 먹지? 🍚</strong>' };
  if (elapsedMinutes < 240) return { state: 'focused', status: '집중력 반짝반짝', message: '점심 생각은 잠깐 접고<br /><strong>할 일 하나씩 뚝딱! ✨</strong>' };
  return { state: 'tired', status: '다크서클 적립 중', message: elapsedMinutes < 360
    ? '코인은 차곡, 피로도 차곡…<br /><strong>내 눈 밑에 그늘이 생겼어!</strong>'
    : '다크서클이 무럭무럭…<br /><strong>퇴근 요정아, 오고 있지? 🥺</strong>' };
};
const renderMood = (now, elapsedMinutes, workMinutes, startMinutes, endMinutes) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const beforeWork = startMinutes < endMinutes && currentMinutes < startMinutes;
  const mood = workMood(elapsedMinutes, workMinutes, beforeWork);
  robotStage.dataset.mood = mood.state;
  robotStage.classList.toggle('is-sleeping', !startedAt);
  // Grow the shadows throughout the tired phase, then clear them for the last hour.
  const fatigue = mood.state === 'tired' ? Math.min(1, Math.max(0, (elapsedMinutes - 240) / Math.max(1, workMinutes - 300))) : 0;
  robotStage.style.setProperty('--dark-circle-drop', `${4 + fatigue * 14}px`);
  robotStage.style.setProperty('--dark-circle-opacity', String(0.3 + fatigue * 0.45));
  robotStage.setAttribute('aria-label', `${botName()} · ${mood.status}`);
  statusText.textContent = mood.status;
  if (speechBubble.innerHTML !== mood.message) speechBubble.innerHTML = mood.message;
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
  const unit = earningUnits[earningUnit];
  unitInputs.forEach((input) => { input.checked = input.value === earningUnit; });
  rateLabel.textContent = unit.label;
  perMinute.textContent = won.format(minute * unit.seconds / 60);
  coinCaption.textContent = `오늘의 코인 · ${unit.interval}마다 차곡차곡`;
  const now = new Date();
  let elapsedSeconds = startedAt ? elapsedWorkSeconds(now, startMinutes, endMinutes, workMinutes) : 0;
  // Between an overnight shift's end and its next start, that shift is complete.
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  if (startedAt && startMinutes >= endMinutes && currentMinutes > endMinutes && currentMinutes < startMinutes) elapsedSeconds = workMinutes * 60;
  const elapsedMinutes = elapsedSeconds / 60;
  renderMood(now, elapsedMinutes, workMinutes, startMinutes, endMinutes);
  const completedSeconds = creditedSeconds(elapsedSeconds, workMinutes * 60, unit.seconds);
  const completedMinutes = completedSeconds / 60;
  const percent = Math.min(100, Math.round(completedMinutes / workMinutes * 100));
  coinFill.style.height = `${percent}%`;
  coinPercent.textContent = `${percent}%`;
  coinReserve.setAttribute('aria-valuenow', String(percent));
  const earned = Math.min(day, minute * completedMinutes);
  earnedToday.textContent = won.format(earned);
  progressBar.style.width = `${percent}%`;
  const hours = Math.floor(completedMinutes / 60);
  const remainingMinutes = Math.floor(completedMinutes % 60);
  const seconds = Math.floor(completedSeconds % 60);
  elapsedText.textContent = startedAt
    ? `${hours}시간 ${remainingMinutes}분${earningUnit === 'second' ? ` ${seconds}초` : ''} 적립 · 오늘 목표의 ${percent}%`
    : `${name}을 깨우면 ${unit.interval} 단위로 코인이 쌓여요`;
};
startButton.addEventListener('click', () => {
  if (startedAt) { startedAt = null; clearInterval(timer); timer = null; }
  else { startedAt = Date.now(); timer = setInterval(render, 1000); }
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
  earningUnit = 'hour';
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
unitInputs.forEach((input) => input.addEventListener('change', () => {
  if (!input.checked) return;
  earningUnit = input.value;
  render();
  saveSettings();
}));
restoreSettings();
formatSalary();
render();
