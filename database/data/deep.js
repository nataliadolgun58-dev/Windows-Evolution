// Поглиблені дані про настільні версії Windows: властивості, редакції, матриця можливостей.
// Джерела: сторінки Вікіпедії про кожну версію та документація Microsoft Lifecycle.
// Зверніть увагу: деякі функції доступні лише в окремих редакціях (це вказано в описах).

const props = {
  win1:   { ntver: '1.0',     shell: 'MS-DOS Executive (вікна розташовуються плиткою)', media: 'Дискети', successor: 'Windows 2.0' },
  win2:   { ntver: '2.0',     shell: 'MS-DOS Executive (вікна можуть перекриватися)', media: 'Дискети', predecessor: 'Windows 1.0', successor: 'Windows 3.0' },
  win30:  { ntver: '3.0',     shell: 'Program Manager і File Manager', media: 'Дискети', predecessor: 'Windows 2.0', successor: 'Windows 3.1' },
  win31:  { ntver: '3.1',     shell: 'Program Manager і File Manager', media: 'Дискети', predecessor: 'Windows 3.0', successor: 'Windows 95' },
  nt31:   { ntver: 'NT 3.1',  shell: 'Program Manager і File Manager', media: 'Дискети та CD-ROM', successor: 'Windows NT 3.5' },
  win95:  { ntver: '4.00',    codename: 'Chicago', shell: 'Провідник із меню «Пуск» і панеллю завдань', browser: 'Відсутній у базовому випуску (Internet Explorer додавався в Plus! та пізніших випусках)', media: 'Дискети та CD-ROM', predecessor: 'Windows 3.1', successor: 'Windows 98' },
  nt4:    { ntver: 'NT 4.0',  shell: 'Провідник у стилі Windows 95', media: 'CD-ROM', predecessor: 'Windows NT 3.51', successor: 'Windows 2000' },
  win98:  { ntver: '4.10',    codename: 'Memphis', shell: 'Провідник з інтеграцією Internet Explorer (Active Desktop)', browser: 'Internet Explorer 4 (у Second Edition — 5)', media: 'CD-ROM', predecessor: 'Windows 95', successor: 'Windows Me' },
  win2000:{ ntver: 'NT 5.0',  shell: 'Провідник (оновлений)', browser: 'Internet Explorer 5', media: 'CD-ROM', predecessor: 'Windows NT 4.0', successor: 'Windows XP' },
  winme:  { ntver: '4.90',    codename: 'Millennium', shell: 'Провідник', browser: 'Internet Explorer 5.5', media: 'CD-ROM', predecessor: 'Windows 98', successor: 'Windows XP' },
  winxp:  { ntver: 'NT 5.1',  codename: 'Whistler', shell: 'Провідник з візуальним стилем Luna', browser: 'Internet Explorer 6', media: 'CD-ROM', predecessor: 'Windows 2000 та Windows Me', successor: 'Windows Vista' },
  vista:  { ntver: 'NT 6.0',  codename: 'Longhorn', shell: 'Провідник із Windows Aero', browser: 'Internet Explorer 7', media: 'DVD', predecessor: 'Windows XP', successor: 'Windows 7' },
  win7:   { ntver: 'NT 6.1',  codename: 'Vienna (раніше Blackcomb)', shell: 'Провідник з Aero, закріплення програм на панелі завдань', browser: 'Internet Explorer 8', media: 'DVD', predecessor: 'Windows Vista', successor: 'Windows 8' },
  win8:   { ntver: 'NT 6.2',  shell: 'Початковий екран із плитками та класичний робочий стіл', browser: 'Internet Explorer 10', media: 'DVD та цифрове завантаження', predecessor: 'Windows 7', successor: 'Windows 8.1' },
  win81:  { ntver: 'NT 6.3',  codename: 'Blue', shell: 'Початковий екран; кнопка «Пуск» повернулась на панель завдань', browser: 'Internet Explorer 11', media: 'DVD та цифрове завантаження', predecessor: 'Windows 8', successor: 'Windows 10' },
  win10:  { ntver: 'NT 10.0', codename: 'Threshold', shell: 'Меню «Пуск» з живими плитками', browser: 'Microsoft Edge (EdgeHTML); Internet Explorer 11 як додатковий', media: 'USB та цифрове завантаження', predecessor: 'Windows 8.1', successor: 'Windows 11' },
  win11:  { ntver: 'NT 10.0', codename: 'Sun Valley', shell: 'Центроване меню «Пуск» і панель завдань', browser: 'Microsoft Edge (Chromium)', media: 'USB, ISO та цифрове завантаження', predecessor: 'Windows 10' }
};

const editions = {
  win1:   ['Windows 1.01', 'Windows 1.02', 'Windows 1.03', 'Windows 1.04'],
  win2:   ['Windows/286', 'Windows/386'],
  win30:  ['Windows 3.0'],
  win31:  ['Windows 3.1', 'Windows for Workgroups 3.11'],
  nt31:   ['Windows NT 3.1 (робоча станція)', 'Windows NT 3.1 Advanced Server'],
  win95:  ['Windows 95', 'Windows 95 OSR2 (FAT32, лише для виробників ПК)'],
  nt4:    ['Workstation', 'Server', 'Server Enterprise Edition', 'Terminal Server Edition'],
  win98:  ['Windows 98', 'Windows 98 Second Edition'],
  win2000:['Professional', 'Server', 'Advanced Server', 'Datacenter Server'],
  winme:  ['Windows Me'],
  winxp:  ['Home Edition', 'Professional', 'Media Center Edition', 'Tablet PC Edition', 'Professional x64 Edition', 'Starter Edition'],
  vista:  ['Starter', 'Home Basic', 'Home Premium', 'Business', 'Enterprise', 'Ultimate'],
  win7:   ['Starter', 'Home Basic', 'Home Premium', 'Professional', 'Enterprise', 'Ultimate'],
  win8:   ['Windows 8', 'Pro', 'Enterprise', 'Windows RT'],
  win81:  ['Windows 8.1', 'Pro', 'Enterprise', 'Windows RT 8.1'],
  win10:  ['Home', 'Pro', 'Pro for Workstations', 'Education', 'Pro Education', 'Enterprise', 'IoT', 'S mode'],
  win11:  ['Home', 'Pro', 'Pro for Workstations', 'Education', 'Pro Education', 'Enterprise', 'SE', 'IoT Enterprise']
};

// Правила: from — перша версія, until — остання (необовʼязково), except — винятки, extra — додаткові версії
const features = [
  // ІНТЕРФЕЙС
  { name: 'Графічний інтерфейс з вікнами та мишею', cat: 'Інтерфейс', from: 'win1', desc: 'Графічна оболонка над MS-DOS: вікна, меню й керування мишею.' },
  { name: 'Вікна, що перекриваються', cat: 'Інтерфейс', from: 'win2', desc: 'У Windows 1.0 вікна лише розташовувались плиткою; перекриття зʼявилось у Windows 2.0.' },
  { name: 'Меню «Пуск» і панель завдань', cat: 'Інтерфейс', from: 'win95', except: ['win8', 'win81'], desc: 'Дебютували у Windows 95. У Windows 8 меню прибрали, у 8.1 повернули лише кнопку, а повноцінне меню відновили у Windows 10.' },
  { name: 'Кошик', cat: 'Інтерфейс', from: 'win95', desc: 'Тимчасове сховище видалених файлів з можливістю відновлення.' },
  { name: 'Провідник Windows (Explorer)', cat: 'Інтерфейс', from: 'win95', desc: 'Оболонка й файловий менеджер у стилі Windows 95; замінила Program Manager і File Manager.' },
  { name: 'Прозорість Windows Aero', cat: 'Інтерфейс', from: 'vista', until: 'win7', desc: 'Скляні прозорі вікна та ефекти на основі DWM; у Windows 8 стиль став плоским.' },
  { name: 'Прилипання вікон (Aero Snap)', cat: 'Інтерфейс', from: 'win7', desc: 'Перетягування вікна до краю екрана для швидкого розташування.' },
  { name: 'Початковий екран із плитками', cat: 'Інтерфейс', from: 'win8', until: 'win81', desc: 'Повноекранний початковий екран замість меню «Пуск».' },
  { name: 'Віртуальні робочі столи', cat: 'Інтерфейс', from: 'win10', desc: 'Кілька робочих столів для розподілу програм.' },
  { name: 'Системна темна тема', cat: 'Інтерфейс', from: 'win10', desc: 'Темний режим для системи та застосунків.' },
  { name: 'Центроване меню «Пуск» і Snap Layouts', cat: 'Інтерфейс', from: 'win11', desc: 'Нове розташування «Пуску» та шаблони розташування вікон.' },
  // ФАЙЛИ Й ДИСКИ
  { name: 'Довгі імена файлів', cat: 'Файли й диски', from: 'win95', extra: ['nt31'], desc: 'Імена довші за формат 8.3. У лінії NT підтримувались уже у Windows NT 3.1 (на NTFS).' },
  { name: 'Файлова система NTFS', cat: 'Файли й диски', from: 'nt31', except: ['win95', 'win98', 'winme'], desc: 'Журнальна файлова система з правами доступу; у лінії MS-DOS (95/98/Me) не підтримувалась.' },
  { name: 'FAT32', cat: 'Файли й диски', from: 'win98', except: ['nt4'], desc: 'Підтримка великих дисків; у Windows 95 була лише у випуску OSR2.' },
  { name: 'Шифрування файлів EFS', cat: 'Файли й диски', from: 'win2000', except: ['winme'], desc: 'Шифрування на рівні файлів на томах NTFS (доступність залежить від редакції).' },
  { name: 'Відновлення системи', cat: 'Файли й диски', from: 'winme', desc: 'Точки відновлення для відкату змін системи; вперше зʼявилось у Windows Me.' },
  { name: 'Диспетчер завдань', cat: 'Файли й диски', from: 'nt4', except: ['win98', 'winme'], desc: 'Перегляд процесів і ресурсів; у лінії MS-DOS (98/Me) не було.' },
  // МЕРЕЖА
  { name: 'Вбудований стек TCP/IP', cat: 'Мережа', from: 'win95', extra: ['nt31'], desc: 'Підтримка інтернет-протоколів «з коробки».' },
  { name: 'Internet Explorer у складі системи', cat: 'Мережа', from: 'win98', until: 'win10', desc: 'Браузер, інтегрований у систему; у Windows 11 IE вимкнено на користь Edge.' },
  { name: 'Бездротові мережі Wi-Fi', cat: 'Мережа', from: 'winxp', desc: 'Вбудована підтримка Wi-Fi (Wireless Zero Configuration).' },
  { name: 'Віддалений робочий стіл (RDP)', cat: 'Мережа', from: 'winxp', desc: 'Підключення до комп\'ютера через мережу (серверна частина — в редакціях Pro й вище).' },
  { name: 'Вхід у домен Active Directory', cat: 'Мережа', from: 'win2000', except: ['winme'], desc: 'Робота в корпоративному домені (недоступно в редакціях Home).' },
  // БЕЗПЕКА
  { name: 'Облікові записи й права доступу', cat: 'Безпека', from: 'nt31', except: ['win95', 'win98', 'winme'], desc: 'Розмежування прав користувачів на рівні ядра NT.' },
  { name: 'Брандмауер Windows', cat: 'Безпека', from: 'winxp', desc: 'Вбудований мережевий екран.' },
  { name: 'Контроль облікових записів (UAC)', cat: 'Безпека', from: 'vista', desc: 'Запит підтвердження для дій, що потребують прав адміністратора.' },
  { name: 'Шифрування дисків BitLocker', cat: 'Безпека', from: 'vista', desc: 'Шифрування томів (доступність залежить від редакції).' },
  { name: 'Microsoft Defender як антивірус', cat: 'Безпека', from: 'win8', desc: 'Вбудований антивірус; раніше існував лише як захист від шпигунського ПЗ.' },
  { name: 'Безпечне завантаження (Secure Boot)', cat: 'Безпека', from: 'win8', desc: 'Захист процесу запуску на UEFI-компʼютерах.' },
  { name: 'Windows Hello', cat: 'Безпека', from: 'win10', desc: 'Вхід за обличчям, відбитком пальця або PIN-кодом.' },
  { name: 'Обовʼязкова вимога TPM 2.0', cat: 'Безпека', from: 'win11', desc: 'Windows 11 офіційно потребує модуль TPM 2.0.' },
  // МУЛЬТИМЕДІА Й ІГРИ
  { name: 'DirectX', cat: 'Мультимедіа й ігри', from: 'win95', desc: 'Набір API для ігор і мультимедіа; версія залежить від системи й оновлень.' },
  { name: 'Windows Media Player', cat: 'Мультимедіа й ігри', from: 'win98', desc: 'Програвач мультимедіа (у Windows 98 — починаючи з Second Edition).' },
  { name: 'Windows Update', cat: 'Мультимедіа й ігри', from: 'win98', desc: 'Онлайн-оновлення системи.' },
  { name: 'Microsoft Store', cat: 'Мультимедіа й ігри', from: 'win8', desc: 'Магазин застосунків.' },
  { name: 'DirectX 12', cat: 'Мультимедіа й ігри', from: 'win10', desc: 'Низькорівневе графічне API.' },
  { name: 'Xbox Game Bar', cat: 'Мультимедіа й ігри', from: 'win10', desc: 'Ігрова панель із записом екрана.' },
  // СИСТЕМНІ
  { name: 'Захищена памʼять процесів (ядро NT)', cat: 'Системні', from: 'nt31', except: ['win95', 'win98', 'winme'], desc: 'Ізоляція процесів у лінії NT.' },
  { name: 'Plug and Play', cat: 'Системні', from: 'win95', except: ['nt4'], desc: 'Автоматичне розпізнавання пристроїв (у лінії NT зʼявилось у Windows 2000).' },
  { name: 'Підтримка USB', cat: 'Системні', from: 'win98', except: ['nt4'], desc: 'Повноцінна підтримка USB (у Windows 95 — з випуску OSR2.1).' },
  { name: '64-бітна версія', cat: 'Системні', from: 'winxp', desc: 'Для XP — окрема редакція x64; у Windows 11 доступна лише 64-бітна версія.' },
  { name: 'Hyper-V для клієнтської Windows', cat: 'Системні', from: 'win8', desc: 'Віртуалізація (в редакціях Pro й вище).' },
  { name: 'Підсистема Windows для Linux (WSL)', cat: 'Системні', from: 'win10', desc: 'Запуск Linux-програм усередині Windows.' },
  { name: 'Пошук по системі (Instant Search)', cat: 'Системні', from: 'vista', desc: 'Індексований миттєвий пошук з меню «Пуск».' },
  { name: 'Запуск Android-застосунків (WSA)', cat: 'Системні', from: 'win11', desc: 'Підсистема Windows для Android; Microsoft припинила її підтримку в березні 2025 року.' }
];

module.exports = { props, editions, features };
