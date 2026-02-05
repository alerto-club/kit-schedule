/* ================= ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ================= */
let fullData = {};
let currentSchedule = [];
let groupedByDate = {};
let sortedDateKeys = [];

// Состояние приложения
let appMode = 'groups'; // 'groups', 'teachers', 'rooms'
let currentId = null; 
let viewMode = 'week'; 
let currentSlide = 0;
let weekType = 'odd'; 

// Хранилище избранного
let trackedData = { groups: [], teachers: [], rooms: [] };

// Конфигурация режимов
const MODE_CONFIG = {
    groups: { 
        label: 'Мои группы', 
        btnText: '+ Добавить группу', 
        placeholder: 'Номер группы (напр. 4434)', 
        storeKey: 'kai_tracked_groups', 
        lastKey: 'kai_last_group', 
        whoLabel: 'Преподаватель', 
        emptyText: 'Добавьте группу, чтобы увидеть расписание' 
    },
    teachers: { 
        label: 'Мои преподаватели', 
        btnText: '+ Добавить преподавателя', 
        placeholder: 'Фамилия (напр. Иванов)', 
        storeKey: 'kai_tracked_teachers', 
        lastKey: 'kai_last_teacher', 
        whoLabel: 'Группы', 
        emptyText: 'Добавьте преподавателя, чтобы следить за его парами' 
    },
    rooms: { 
        label: 'Мои аудитории', 
        btnText: '+ Добавить аудиторию', 
        placeholder: 'Аудитория (напр. 7/309)', 
        storeKey: 'kai_tracked_rooms', 
        lastKey: 'kai_last_room', 
        whoLabel: 'Преподаватель', 
        emptyText: 'Добавьте аудиторию для просмотра занятости' 
    }
};

// Переменные для свайпов
let touchStartX = 0; 
let touchEndX = 0;

// DOM элементы
const wrapper = document.getElementById('slidesWrapper');
const dayTabs = document.querySelectorAll('.day-tab');
const searchModal = document.getElementById('searchModal');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// Календарь учебных недель (можно обновлять в будущем)
const w1_days = ['12.01','13.01','14.01','15.01','16.01','17.01','26.01','27.01','28.01','29.01','30.01','31.01','09.02','10.02','11.02','12.02','13.02','14.02','23.02','24.02','25.02','26.02','27.02','28.02'];
const w2_days = ['19.01','20.01','21.01','22.01','23.01','24.01','02.02','03.02','04.02','05.02','06.02','07.02','16.02','17.02','18.02','19.02','20.02','21.02','02.03','03.03','04.03','05.03','06.03','07.03'];
const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

function hideLoader() { 
    const l = document.getElementById('loader'); 
    if(l){l.style.opacity='0'; setTimeout(()=>l.style.display='none',500);} 
}

/* ================= HEADER & UI ================= */

function updateHeader() {
    const now = new Date();
    const dateText = `${now.getDate()} ${months[now.getMonth()]}`;
    
    if (!currentId) {
        document.getElementById('headerDate').innerHTML = "Расписание";
        document.getElementById('headerSubInfo').innerHTML = "Нет данных";
        return;
    }

    let displayId = currentId;
    if (displayId.length > 15) displayId = displayId.substring(0, 13) + '...';
    document.getElementById('headerDate').innerHTML = `${dateText} <span class="group-badge">${displayId}</span>`;

    const todayShort = ("0" + now.getDate()).slice(-2) + "." + ("0" + (now.getMonth() + 1)).slice(-2);
    const isOdd = w1_days.includes(todayShort);

    if (viewMode === 'week') {
        const text = isOdd ? 'Нечётная неделя' : 'Чётная неделя';
        document.getElementById('headerSubInfo').innerHTML = `<span class="week-badge">${text}</span>`;
    } else {
        const activeDateStr = sortedDateKeys[currentSlide];
        if (activeDateStr) {
            const [d, m] = activeDateStr.split('.').map(Number);
            let y = now.getFullYear(); if (now.getMonth() > 7 && m < 5) y++;
            const dayName = daysOfWeek[new Date(y, m-1, d).getDay()];
            const activeIsOdd = w1_days.includes(activeDateStr);
            document.getElementById('headerSubInfo').innerHTML = `<span class="week-badge">${dayName} • ${activeIsOdd ? 'Нечёт' : 'Чёт'}</span>`;
        }
    }
}

/* ================= ЛОГИКА ДАТ И КАРТОЧЕК ================= */

function isDateMatchingDay(dateStr, dayId) {
    const [d, m] = dateStr.split('.').map(Number);
    const now = new Date();
    let y = now.getFullYear(); if (now.getMonth() > 7 && m < 5) y++;
    const dateObj = new Date(y, m - 1, d);
    let day = dateObj.getDay() - 1; if (day === -1) day = 6;
    return day === dayId;
}

function processDates() {
    groupedByDate = {};
    if (!currentSchedule) return;
    currentSchedule.forEach(day => {
        (day.lessons || []).forEach(lesson => {
            const raw = (lesson.dates || "").toLowerCase().trim();
            let targetDates = [];
            if (raw === 'все') targetDates = [...w1_days, ...w2_days];
            else if (raw === 'неч') targetDates = w1_days;
            else if (raw === 'чет') targetDates = w2_days;
            else if (raw.includes('.')) targetDates = raw.split(' ').filter(d => d.trim());

            targetDates.forEach(d => {
                if (isDateMatchingDay(d, day.dayId)) {
                    if (!groupedByDate[d]) groupedByDate[d] = [];
                    groupedByDate[d].push(lesson);
                }
            });
        });
    });
    sortedDateKeys = Object.keys(groupedByDate).sort((a,b) => {
        const [d1, m1] = a.split('.').map(Number);
        const [d2, m2] = b.split('.').map(Number);
        return m1 !== m2 ? m1 - m2 : d1 - d2;
    });
}

function createCard(l) {
    const div = document.createElement('div');
    div.className = 'lesson-card';
    div.dataset.dates = (l.dates || "").toLowerCase().trim();
    div.setAttribute('data-raw-type', l.type);
    div.onclick = () => openCard(l);
    const times = (l.time || "").split(' - ');
    
    // Мета-информация в зависимости от режима
    let metaInfo = '';
    if (appMode === 'groups') metaInfo = l.room;
    else if (appMode === 'teachers') metaInfo = `${l.group} | ${l.room}`;
    else if (appMode === 'rooms') metaInfo = l.teacher;

    div.innerHTML = `<div class="type-indicator"></div>
        <div class="card-content">
            <div class="card-time-col">
                <span class="time-start">${times[0] || "??"}</span>
                <span class="time-end">${times[1] || ""}</span>
                <span class="lesson-type-badge">${l.type}</span>
            </div>
            <div class="card-info-col">
                <div class="lesson-subject">${l.subject}</div>
                <div class="lesson-meta">
                    <span class="lesson-room">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        ${metaInfo}
                    </span>
                </div>
            </div>
        </div>`;
    return div;
}

/* ================= СИСТЕМА ОТРИСОВКИ (RENDER) ================= */

function render() {
    const emptyView = document.getElementById('emptyStateView');
    const mainSlider = document.getElementById('sliderContainer');
    const headerControls = document.querySelector('.controls-right');
    const navContainer = document.querySelector('.nav-container');

    // 1. СНАЧАЛА ОБНОВЛЯЕМ ИНТЕРФЕЙС НАСТРОЕК (DRAWER)
    // Это гарантирует, что даже при пустом экране настройки будут актуальны
    const conf = MODE_CONFIG[appMode];
    
    const listTitle = document.getElementById('savedListTitle');
    if (listTitle) listTitle.innerText = conf.label;
    
    const addBtn = document.getElementById('btnAddItem');
    if (addBtn) addBtn.innerText = conf.btnText;
    
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    if(appMode === 'groups') document.getElementById('typeGroups').classList.add('active');
    if(appMode === 'teachers') document.getElementById('typeTeachers').classList.add('active');
    if(appMode === 'rooms') document.getElementById('typeRooms').classList.add('active');

    // 2. ПРОВЕРЯЕМ ДАННЫЕ ДЛЯ ОСНОВНОГО ЭКРАНА
    if (!currentId) {
        emptyView.classList.add('visible');
        const emptyTextEl = document.getElementById('emptyStateText');
        if (emptyTextEl) emptyTextEl.innerText = conf.emptyText;
        
        mainSlider.style.display = 'none';
        navContainer.style.display = 'none';
        
        // Оставляем шестеренку доступной
        headerControls.style.opacity = '1'; 
        headerControls.style.pointerEvents = 'auto';
        
        const toggleWrapper = document.querySelector('.toggle-wrapper');
        if (toggleWrapper) toggleWrapper.style.display = 'none'; 
        
        updateHeader();
        return; 
    }

    // 3. ЕСЛИ ДАННЫЕ ЕСТЬ — РИСУЕМ РАСПИСАНИЕ
    emptyView.classList.remove('visible');
    mainSlider.style.display = 'block';
    navContainer.style.display = 'block';
    
    const toggleWrapper = document.querySelector('.toggle-wrapper');
    if (toggleWrapper) toggleWrapper.style.display = 'flex';

    if (!wrapper) return;
    wrapper.innerHTML = '';
    
    if (viewMode === 'week') {
        [0,1,2,3,4,5].forEach(id => {
            const slide = document.createElement('div'); slide.className = 'day-slide';
            const empty = document.createElement('div'); empty.className = 'empty-msg'; empty.innerText = 'Пар нет';
            slide.appendChild(empty);
            const dayData = currentSchedule.find(d => d.dayId === id);
            if (dayData) dayData.lessons.forEach(l => slide.appendChild(createCard(l)));
            wrapper.appendChild(slide);
        });
        setWeekMode(weekType);
    } else {
        const nav = document.getElementById('dateNav'); nav.innerHTML = '';
        sortedDateKeys.forEach((d, i) => {
            const p = document.createElement('div'); p.className = 'date-pill'; p.innerText = d;
            p.onclick = () => goToSlide(i); nav.appendChild(p);
        });
        sortedDateKeys.forEach(dateStr => {
            const slide = document.createElement('div'); slide.className = 'day-slide';
            groupedByDate[dateStr].sort((a,b)=>a.time.localeCompare(b.time)).forEach(l => slide.appendChild(createCard(l)));
            wrapper.appendChild(slide);
        });
    }
    updateHeader();
}

function goToSlide(idx) {
    if (!currentId) return;
    const max = viewMode === 'week' ? 5 : (sortedDateKeys.length - 1);
    if (idx < 0) idx = 0; if (idx > max) idx = max;
    currentSlide = idx;
    wrapper.style.transform = `translateX(${-idx * 100}%)`;
    if (viewMode === 'week') dayTabs.forEach((t, i) => t.classList.toggle('active', i === idx));
    else document.querySelectorAll('.date-pill').forEach((p, i) => {
        p.classList.toggle('active', i === idx);
        if (i === idx) p.scrollIntoView({behavior: 'smooth', inline: 'center'});
    });
    updateHeader();
}

function setWeekMode(mode) {
    weekType = mode;
    const toggleBg = document.getElementById('toggleBg');
    if (toggleBg) toggleBg.style.transform = mode === 'odd' ? 'translateX(0)' : 'translateX(100%)';
    document.getElementById('btnOdd').classList.toggle('active', mode === 'odd');
    document.getElementById('btnEven').classList.toggle('active', mode === 'even');
    
    if (viewMode === 'week' && currentId) {
        document.querySelectorAll('.lesson-card').forEach(card => {
            const d = card.dataset.dates;
            let visible = false;
            if (d === 'все' || d === '') visible = true;
            else if (mode === 'odd') visible = (d === 'неч' || w1_days.some(wd => d.includes(wd)));
            else if (mode === 'even') visible = (d === 'чет' || w2_days.some(wd => d.includes(wd)));
            card.classList.toggle('hidden', !visible);
        });
        document.querySelectorAll('.day-slide').forEach(s => {
            const vis = s.querySelectorAll('.lesson-card:not(.hidden)').length;
            s.querySelector('.empty-msg').classList.toggle('visible', vis === 0);
        });
    }
}

/* ================= ПЕРЕКЛЮЧЕНИЕ ДАННЫХ ================= */

function changeScheduleType(newType) {
    appMode = newType;
    localStorage.setItem('kai_app_mode', newType);
    
    const list = trackedData[newType] || [];
    const subset = fullData[newType] || {};
    
    // 1. Пробуем взять последний открытый ID
    let candidateId = localStorage.getItem(MODE_CONFIG[newType].lastKey);
    
    // 2. Проверяем валидность: существует ли такой ID в текущем JSON
    // Если нет, ищем первый валидный ID из списка избранного
    if (!candidateId || !subset[candidateId]) {
        candidateId = list.find(id => subset[id]);
    }

    if (candidateId) {
        switchItem(candidateId);
    } else {
        // Если ничего не нашли - сбрасываем состояние
        currentSchedule = [];
        currentId = null;
        render(); // Покажет Empty State
        renderTrackedItems();
    }
}

function switchItem(id) {
    const subset = fullData[appMode];
    
    // Защита от несуществующих ID
    if (!subset || !subset[id]) {
        console.warn(`ID ${id} не найден в режиме ${appMode}`);
        return;
    }

    currentId = id;
    localStorage.setItem(MODE_CONFIG[appMode].lastKey, id);
    currentSchedule = subset[id];
    
    processDates();
    render();
    closeSettings();
    jumpToday();
}

function jumpToday() {
    if (!currentId) return;
    const now = new Date();
    if (viewMode === 'week') {
        let d = now.getDay() - 1; if (d < 0 || d > 5) d = 0; goToSlide(d);
    } else {
        const val = (now.getMonth() + 1) * 100 + now.getDate();
        let idx = 0;
        for(let i=0; i<sortedDateKeys.length; i++) {
            const [d, m] = sortedDateKeys[i].split('.').map(Number);
            if ((m * 100 + d) >= val) { idx = i; break; }
            if (i === sortedDateKeys.length - 1) idx = i;
        }
        goToSlide(idx);
    }
}

function changeViewMode(m) {
    viewMode = m; localStorage.setItem('kai_view_mode', m);
    document.body.className = 'mode-' + m;
    document.getElementById('optWeek').classList.toggle('active', m === 'week');
    document.getElementById('optDate').classList.toggle('active', m === 'date');
    render(); jumpToday(); closeSettings();
}

/* ================= ПОИСК И ДОБАВЛЕНИЕ ================= */

function openSearchModal() {
    closeSettings();
    searchModal.classList.add('open');
    searchInput.placeholder = MODE_CONFIG[appMode].placeholder;
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchResults.classList.remove('visible');
    searchInput.focus();
}

function closeSearchModal() {
    searchModal.classList.remove('open');
}

searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    searchResults.innerHTML = '';
    
    if (val.length < 1) {
        searchResults.classList.remove('visible');
        return;
    }

    const allKeys = Object.keys(fullData[appMode] || {});
    // Ограничиваем выдачу 50 результатами
    const matches = allKeys.filter(key => key.toLowerCase().includes(val)).slice(0, 50);

    if (matches.length > 0) {
        searchResults.classList.add('visible');
        matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            // Подсветка совпадения
            const regex = new RegExp(`(${val})`, 'gi');
            const highlighted = match.replace(regex, '<span class="search-match">$1</span>');
            
            div.innerHTML = `<span>${highlighted}</span>`;
            div.onclick = () => addItem(match);
            searchResults.appendChild(div);
        });
    } else {
        searchResults.classList.remove('visible');
    }
});

function addItem(val) {
    if (fullData[appMode] && fullData[appMode][val]) {
        if (!trackedData[appMode].includes(val)) {
            trackedData[appMode].push(val);
            localStorage.setItem(MODE_CONFIG[appMode].storeKey, JSON.stringify(trackedData[appMode]));
        }
        switchItem(val);
        closeSearchModal();
    }
}

/* ================= НАСТРОЙКИ (DRAWER) ================= */

function toggleSettings() {
    const d = document.getElementById('settingsDrawer');
    d.classList.toggle('open');
    if (d.classList.contains('open')) renderTrackedItems();
}

function renderTrackedItems() {
    const listContainer = document.getElementById('trackedGroupsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const list = trackedData[appMode] || [];

    if (list.length === 0) {
        listContainer.innerHTML = `
            <div style="color: #52525b; text-align: center; padding: 30px 10px; font-size: 0.9rem;">
                Список пуст.<br>Нажмите кнопку ниже, чтобы добавить.
            </div>`;
        return;
    }

    list.forEach(id => {
        const card = document.createElement('div');
        card.className = `settings-group-card ${id === currentId ? 'active' : ''}`;
        card.onclick = () => switchItem(id); 
        card.innerHTML = `<div class="group-info"><div class="group-icon">${id.substring(0,1)}</div><div class="group-name">${id}</div></div>
            <div class="settings-actions">${id === currentId ? '<div class="btn-action btn-select">✓</div>' : ''}
            <button class="btn-action btn-delete" onclick="removeItem('${id}', event)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg></button></div>`;
        listContainer.appendChild(card);
    });
}

function removeItem(id, event) {
    event.stopPropagation();
    const list = trackedData[appMode];
    
    if (confirm(`Удалить ${id} из избранного?`)) {
        trackedData[appMode] = list.filter(item => item !== id);
        localStorage.setItem(MODE_CONFIG[appMode].storeKey, JSON.stringify(trackedData[appMode]));
        
        // Если удалили активный элемент
        if (id === currentId) {
             // Пытаемся переключиться на первый доступный
             if (trackedData[appMode].length > 0) {
                 switchItem(trackedData[appMode][0]);
             } else {
                 // Если список опустел
                 currentId = null;
                 currentSchedule = [];
                 localStorage.removeItem(MODE_CONFIG[appMode].lastKey);
                 render(); // Покажет Empty State
                 renderTrackedItems();
             }
        } else {
            renderTrackedItems();
        }
    }
}

function hardResetApp() {
    if (confirm("Это удалит сохраненные данные и обновит приложение. Продолжить?")) {
        localStorage.clear();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                }
            });
        }
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) caches.delete(name);
            });
        }
        window.location.reload(true);
    }
}

/* ================= МОДАЛКИ И ИНИЦИАЛИЗАЦИЯ ================= */

function openCard(l) {
    document.getElementById('mSubject').innerText = l.subject;
    document.getElementById('mTime').innerText = l.time;
    document.getElementById('mRoom').innerText = l.room;
    
    document.getElementById('mWhoLabel').innerText = MODE_CONFIG[appMode].whoLabel;
    
    let whoText = "";
    if (appMode === 'groups') whoText = l.teacher;
    else if (appMode === 'teachers') whoText = l.group; 
    else if (appMode === 'rooms') whoText = `${l.teacher} (${l.group})`;
    
    document.getElementById('mWho').innerText = whoText || "—";
    
    const d = (l.dates || "").toLowerCase();
    document.getElementById('mDates').innerText = d === 'все' ? 'Каждую неделю' : (d === 'чет' ? 'Чётная неделя' : (d === 'неч' ? 'Нечётная неделя' : l.dates));
    
    const t = document.getElementById('mType'); t.innerText = l.type;
    const color = l.type === 'Л.Р.' ? 'var(--color-lab)' : (l.type === 'ЛЕК' ? 'var(--color-lek)' : 'var(--color-prac)');
    t.style.color = color; document.getElementById('mWho').style.color = color;
    document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function closeSettings() { document.getElementById('settingsDrawer').classList.remove('open'); }

const slider = document.getElementById('sliderContainer');
slider.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
slider.addEventListener('touchend', e => { 
    touchEndX = e.changedTouches[0].screenX; 
    if (Math.abs(touchEndX - touchStartX) > 50) {
        if (touchEndX < touchStartX) goToSlide(currentSlide + 1);
        else goToSlide(currentSlide - 1);
    }
}, {passive: true});

window.addEventListener('load', () => {
    // Добавляем timestamp, чтобы избежать кеширования самого json при запросе
    fetch('schedule.json?v=' + Date.now()).then(r => r.json()).then(data => {
        fullData = data;
        
        // Загрузка списков
        trackedData.groups = JSON.parse(localStorage.getItem('kai_tracked_groups') || '["4434"]');
        trackedData.teachers = JSON.parse(localStorage.getItem('kai_tracked_teachers') || '[]');
        trackedData.rooms = JSON.parse(localStorage.getItem('kai_tracked_rooms') || '[]');
        
        // Восстановление состояния
        appMode = localStorage.getItem('kai_app_mode') || 'groups';
        viewMode = localStorage.getItem('kai_view_mode') || 'week';
        
        document.body.className = 'mode-' + viewMode;
        
        // Инициализация
        changeScheduleType(appMode);

        const now = new Date();
        const dStr = ("0" + now.getDate()).slice(-2) + "." + ("0" + (now.getMonth() + 1)).slice(-2);
        setWeekMode(w1_days.includes(dStr) ? 'odd' : 'even');
        const dIdx = now.getDay() - 1;
        if (dIdx >= 0 && dIdx <= 5) dayTabs[dIdx].classList.add('today-mark');
    }).catch(e => {
        console.error(e);
        // Можно показать уведомление, если данные не загрузились
    }).finally(() => setTimeout(hideLoader, 400));
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');