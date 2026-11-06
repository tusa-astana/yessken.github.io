import { Injectable, effect, signal } from '@angular/core';

export type Locale = 'ru' | 'kz' | 'en';

export type TranslationKey =
  | 'nav.events'
  | 'nav.meetups'
  | 'meetups.peoplePlansKicker'
  | 'meetups.peoplePlansTitle'
  | 'meetups.allInterests'
  | 'meetups.peoplePlansLoading'
  | 'meetups.peoplePlansUnavailable'
  | 'meetups.peopleGoing'
  | 'meetups.openPlan'
  | 'meetups.peoplePlansDisclaimer'
  | 'meetups.peoplePlansEmpty'
  | 'meetups.proposePlan'
  | 'nav.calendar'
  | 'nav.map'
  | 'nav.tickets'
  | 'nav.profile'
  | 'nav.publish'
  | 'nav.terms'
  | 'nav.section'
  | 'nav.mainAria'
  | 'theme.switchToDark'
  | 'theme.switchToLight'
  | 'breadcrumb.home'
  | 'breadcrumb.events'
  | 'breadcrumb.meetups'
  | 'breadcrumb.calendar'
  | 'breadcrumb.event'
  | 'breadcrumb.ticket'
  | 'breadcrumb.orders'
  | 'breadcrumb.review'
  | 'breadcrumb.botMessages'
  | 'breadcrumb.analytics'
  | 'breadcrumb.map'
  | 'breadcrumb.tickets'
  | 'breadcrumb.groups'
  | 'breadcrumb.createEvent'
  | 'breadcrumb.profile'
  | 'breadcrumb.terms'
  | 'home.whatToday'
  | 'home.findEvent'
  | 'home.createEvent'
  | 'home.intro'
  | 'home.footer'
  | 'calendar.title'
  | 'calendar.subtitle'
  | 'calendar.month'
  | 'calendar.week'
  | 'calendar.today'
  | 'calendar.noEvents'
  | 'calendar.allEvents'
  | 'calendar.organizer'
  | 'calendar.terms'
  | 'calendar.demoNotice'
  | 'map.demoNotice'
  | 'events.heading'
  | 'events.allTitle'
  | 'events.subtitle'
  | 'events.organizer'
  | 'events.hobbies'
  | 'communities.heading'
  | 'communities.subtitle'
  | 'communities.disclaimer'
  | 'communities.empty'
  | 'communities.openTelegram'
  | 'communities.boardGamesDescription'
  | 'analytics.heading'
  | 'analytics.description'
  | 'analytics.summary'
  | 'analytics.refresh'
  | 'analytics.loading'
  | 'analytics.loadError'
  | 'analytics.adminRequired'
  | 'analytics.retry'
  | 'analytics.catalogViews'
  | 'analytics.repeatedViewsNote'
  | 'analytics.eventOpens'
  | 'analytics.eventOpensNote'
  | 'analytics.shares'
  | 'analytics.sharesNote'
  | 'analytics.communityClicks'
  | 'analytics.communityClicksNote'
  | 'analytics.meetupShares'
  | 'analytics.meetupSharesNote'
  | 'analytics.meetupInviteOpens'
  | 'analytics.meetupInviteOpensNote'
  | 'analytics.campaigns'
  | 'analytics.noCampaigns'
  | 'analytics.campaignsNote'
  | 'analytics.linkBuilder'
  | 'analytics.venuesLoading'
  | 'analytics.venuesUnavailable'
  | 'analytics.venueLabel'
  | 'analytics.dateLabel'
  | 'analytics.channelLabel'
  | 'analytics.openGeneratedLink'
  | 'analytics.copyLink'
  | 'analytics.linkCopied'
  | 'analytics.linkCopyFailed'
  | 'analytics.linkBuilderNote'
  | 'analytics.caveat'
  | 'analytics.backToProfile'
  | 'events.searchPlaceholder'
  | 'events.filters.all'
  | 'events.filters.free'
  | 'events.filters.under5000'
  | 'events.price.fromOrganizer'
  | 'events.price.freeByOrganizer'
  | 'events.price.contactOrganizer'
  | 'events.details.place'
  | 'events.details.price'
  | 'events.details.organizerInfo'
  | 'events.details.rsvpPolicy'
  | 'events.details.demoNotice'
  | 'events.details.rsvp'
  | 'events.details.rsvpSaved'
  | 'events.details.rsvpSaving'
  | 'events.details.telegramPrompt'
  | 'events.details.rsvpError'
  | 'events.details.share'
  | 'events.details.shareCopied'
  | 'events.details.shareFailed'
  | 'events.details.shareMaterials'
  | 'events.details.copy'
  | 'events.details.copied'
  | 'events.details.notFound'
  | 'events.loading'
  | 'events.empty'
  | 'events.retry'
  | 'events.reset'
  | 'events.demo'
  | 'events.promo'
  | 'events.illustrative'
  | 'checkout.heading'
  | 'checkout.acceptTerms'
  | 'checkout.continue'
  | 'checkout.hint'
  | 'checkout.unavailable'
  | 'checkout.support'
  | 'tickets.heading'
  | 'tickets.legacyNotice'
  | 'tickets.empty'
  | 'tickets.catalog'
  | 'tickets.status.paid'
  | 'tickets.status.pending'
  | 'tickets.status.checkout'
  | 'tickets.status.failed'
  | 'tickets.status.refunded'
  | 'tickets.status.refundRequested'
  | 'tickets.status.expired'
  | 'tickets.status.unknown'
  | 'tickets.open'
  | 'tickets.entryCode'
  | 'tickets.demoNotice'
  | 'orders.heading'
  | 'orders.subtitle'
  | 'orders.sales'
  | 'orders.tickets'
  | 'orders.events'
  | 'orders.createNew'
  | 'orders.noOrders';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  ru: {
    'nav.events': 'События',
    'nav.meetups': 'Вместе',
    'meetups.peoplePlansKicker': 'ОТ УЧАСТНИКОВ',
    'meetups.peoplePlansTitle': 'Планы и встречи',
    'meetups.allInterests': 'Все интересы',
    'meetups.peoplePlansLoading': 'Ищем ближайшие встречи участников…',
    'meetups.peoplePlansUnavailable': 'Не получилось загрузить встречи участников. Общий список мест остаётся ниже.',
    'meetups.peopleGoing': 'идут',
    'meetups.openPlan': 'Открыть по интересу',
    'meetups.peoplePlansDisclaimer': 'Планы предложены участниками групп интересов, не организованы TUSA. Уточняй детали у автора; отметка не гарантирует присутствие.',
    'meetups.peoplePlansEmpty': 'Пока нет ближайших встреч от участников. Можно предложить свой план в группе по интересу.',
    'meetups.proposePlan': 'Найти интерес и предложить встречу',
    'nav.calendar': 'Календарь',
    'nav.map': 'Карта города',
    'nav.tickets': 'Мои билеты',
    'nav.profile': 'Профиль',
    'nav.publish': 'Разместить событие',
    'nav.terms': 'Условия',
    'nav.section': 'Навигация',
    'nav.mainAria': 'Основная навигация',
    'theme.switchToDark': 'Включить тёмную тему',
    'theme.switchToLight': 'Включить светлую тему',
    'breadcrumb.home': 'Главная',
    'breadcrumb.events': 'События',
    'breadcrumb.meetups': 'Вместе',
    'breadcrumb.calendar': 'Календарь',
    'breadcrumb.event': 'Событие',
    'breadcrumb.ticket': 'Билет',
    'breadcrumb.orders': 'Заказы',
    'breadcrumb.review': 'Проверка заявок',
    'breadcrumb.botMessages': 'Сообщения боту',
    'breadcrumb.analytics': 'Аналитика пилота',
    'breadcrumb.map': 'Карта города',
    'breadcrumb.tickets': 'Архив билетов',
    'breadcrumb.groups': 'Сообщества',
    'breadcrumb.createEvent': 'Новое событие',
    'breadcrumb.profile': 'Профиль',
    'breadcrumb.terms': 'Условия',
    'home.whatToday': 'Что ищешь',
    'home.findEvent': 'Найти событие',
    'home.createEvent': 'Создать событие',
    'home.intro': 'Найди событие в Астане или добавь своё в городскую афишу.',
    'home.footer': 'Город начинается с того, что происходит рядом.',
    'calendar.title': 'Афиша Астаны',
    'calendar.subtitle': 'Выберите дату и найдите событие, куда хочется пойти.',
    'calendar.month': 'Месяц',
    'calendar.week': 'Неделя',
    'calendar.today': 'Сегодня',
    'calendar.noEvents': 'На эту дату пока нет опубликованных событий.',
    'calendar.allEvents': 'Все события',
    'calendar.organizer': 'Вы организатор?',
    'calendar.terms': 'Условия и правила',
    'calendar.demoNotice': 'Показаны демо-события: данные хранятся только в приложении и не подтверждают реальные продажи.',
    'map.demoNotice': 'Демо-карта · примеры событий',
    'events.heading': 'Куда сегодня?',
    'events.allTitle': 'Афиша событий',
    'events.subtitle': 'События Астаны на ближайшие дни. Смотри детали, делись планом и отмечай интерес.',
    'events.organizer': 'Организаторам: разместить событие бесплатно',
    'events.hobbies': 'Хобби и клубы',
    'communities.heading': 'Сообщества',
    'communities.subtitle': 'Городские сообщества и каналы, где появляются новые события.',
    'communities.disclaimer': 'Это независимые сообщества — правила и условия уточняйте у их администраторов.',
    'communities.empty': 'Сообщества скоро появятся. Следите за обновлениями TUSA.',
    'communities.openTelegram': 'Открыть Telegram',
    'communities.boardGamesDescription': 'Клуб настольных игр в Астане.',
    'analytics.heading': 'Аналитика пилота',
    'analytics.description': 'Считаем действия в приложении. Повторные открытия возможны; переход в Telegram не означает вступление, RSVP или продажу.',
    'analytics.summary': 'Сводные события воронки',
    'analytics.refresh': 'Обновить',
    'analytics.loading': 'Загружаем сводку…',
    'analytics.loadError': 'Не удалось загрузить аналитику',
    'analytics.adminRequired': 'Нужен доступ администратора TUSA из Telegram и соединение с API.',
    'analytics.retry': 'Повторить',
    'analytics.catalogViews': 'Открытия афиши',
    'analytics.repeatedViewsNote': 'Повторные открытия включены',
    'analytics.eventOpens': 'Открытия событий',
    'analytics.eventOpensNote': 'Карточки событий',
    'analytics.shares': 'Отправки ссылок',
    'analytics.sharesNote': 'Попытки поделиться событием',
    'analytics.communityClicks': 'Переходы в сообщества',
    'analytics.communityClicksNote': 'Нажатия на внешние ссылки',
    'analytics.meetupShares': 'Отправки планов',
    'analytics.meetupSharesNote': 'Намерения поделиться местом и датой',
    'analytics.meetupInviteOpens': 'Открытия приглашений',
    'analytics.meetupInviteOpensNote': 'Повторные открытия включены',
    'analytics.campaigns': 'Каналы seed-host пилота',
    'analytics.noCampaigns': 'Пока нет событий с кодом кампании.',
    'analytics.campaignsNote': 'Коды не содержат имён или username; внешний список соответствия host-ам храните отдельно. Повторные открытия считаются отдельно; метрика не показывает уникальных людей, доставку или посещаемость.',
    'analytics.linkBuilder': 'Собрать ссылку для host-а',
    'analytics.venuesLoading': 'Загружаем публичный каталог мест…',
    'analytics.venuesUnavailable': 'Каталог мест пока недоступен. Попробуй обновить страницу.',
    'analytics.venueLabel': 'Место',
    'analytics.dateLabel': 'Дата плана',
    'analytics.channelLabel': 'Код канала',
    'analytics.openGeneratedLink': 'Открыть ссылку ↗',
    'analytics.copyLink': 'Скопировать ссылку',
    'analytics.linkCopied': 'Ссылка скопирована.',
    'analytics.linkCopyFailed': 'Не удалось скопировать. Открой ссылку или скопируй её вручную.',
    'analytics.linkBuilderNote': 'Код назначай только после согласия host-а. Ссылка не подтверждает план, бронь или присутствие.',
    'analytics.caveat': '«Переходы в сообщества» — нажатия на внешние Telegram-ссылки, не число вступивших участников. RSVP — отметка интереса, не билет.',
    'analytics.backToProfile': '← В профиль',
    'events.searchPlaceholder': 'Название, место или описание',
    'events.filters.all': 'Все категории',
    'events.filters.free': 'Бесплатно',
    'events.filters.under5000': 'До 5 000 ₸',
    'events.price.fromOrganizer': 'Цена от организатора',
    'events.price.freeByOrganizer': 'Бесплатно по данным организатора',
    'events.price.contactOrganizer': 'Условия участия уточняйте у организатора',
    'events.details.place': 'Место',
    'events.details.price': 'Стоимость',
    'events.details.organizerInfo': 'Информация предоставлена организатором',
    'events.details.rsvpPolicy': 'RSVP — это отметка интереса, не билет и не бронь. Условия входа уточняйте у организатора.',
    'events.details.demoNotice': 'Демо-пример. Событие и условия не подтверждены.',
    'events.details.rsvp': 'Мне интересно',
    'events.details.rsvpSaved': 'Вы отметили интерес',
    'events.details.rsvpSaving': 'Сохраняем…',
    'events.details.telegramPrompt': 'Откройте TUSA в Telegram, чтобы отметить интерес.',
    'events.details.rsvpError': 'Не удалось сохранить отметку. Проверьте соединение и попробуйте ещё раз.',
    'events.details.share': 'Поделиться событием',
    'events.details.shareCopied': 'Ссылка скопирована',
    'events.details.shareFailed': 'Не удалось поделиться',
    'events.details.shareMaterials': 'Материалы для публикации',
    'events.details.copy': 'Скопировать текст',
    'events.details.copied': 'Текст скопирован',
    'events.details.notFound': 'Событие не найдено.',
    'events.loading': 'Загружаем события…',
    'events.empty': 'Подходящих событий пока нет',
    'events.retry': 'Повторить',
    'events.reset': 'Сбросить фильтры',
    'events.demo': 'Пример',
    'events.promo': 'Промо',
    'events.illustrative': 'Иллюстрация',
    'checkout.heading': 'Информация о покупке',
    'checkout.acceptTerms': 'Я прочитал(а) и принимаю',
    'checkout.continue': 'Покупка отключена',
    'checkout.hint': 'TUSA не продаёт билеты на офлайн-события и не принимает оплату за вход. Внутренние платные цифровые услуги, если они включены, оплачиваются только Telegram Stars.',
    'checkout.unavailable': 'Покупка офлайн-билетов отключена',
    'checkout.support': 'Написать в поддержку',
    'tickets.heading': 'Архив билетов',
    'tickets.legacyNotice': 'Здесь доступны ранее оформленные билеты. TUSA больше не продаёт офлайн-вход; RSVP не является билетом.',
    'tickets.empty': 'Ранее оформленных билетов нет. RSVP и отметка интереса не резервируют вход.',
    'tickets.catalog': 'Открыть каталог событий',
    'tickets.status.paid': 'Оплачено',
    'tickets.status.pending': 'Счёт выставлен',
    'tickets.status.checkout': 'Подтверждаем оплату',
    'tickets.status.failed': 'Ошибка оплаты',
    'tickets.status.refunded': 'Возврат оформлен',
    'tickets.status.refundRequested': 'Возврат на проверке',
    'tickets.status.expired': 'Счёт истёк',
    'tickets.status.unknown': 'Статус уточняется',
    'tickets.open': 'О событии',
    'tickets.entryCode': 'Код входа:',
    'tickets.demoNotice': 'Демо-билет. QR-код не даёт права на вход.',
    'orders.heading': 'Заказы',
    'orders.subtitle': 'Продажи по вашим событиям и общий обзор для администратора.',
    'orders.sales': 'Выручка',
    'orders.tickets': 'Билеты',
    'orders.events': 'События',
    'orders.createNew': 'Разместить новое событие',
    'orders.noOrders': 'Заказов по вашим событиям пока нет. Для доступа откройте TUSA из Telegram.',
  },
  kz: {
    'nav.events': 'Іс-шақтар',
    'nav.meetups': 'Бірге',
    'meetups.peoplePlansKicker': 'ҚАТЫСУШЫЛАРДАН',
    'meetups.peoplePlansTitle': 'Жоспарлар мен кездесулер',
    'meetups.allInterests': 'Барлық қызығушылықтар',
    'meetups.peoplePlansLoading': 'Қатысушылардың жақын кездесулерін іздеп жатырмыз…',
    'meetups.peoplePlansUnavailable': 'Қатысушылар кездесулерін жүктеу мүмкін болмады. Орындар тізімі төменде қолжетімді.',
    'meetups.peopleGoing': 'барады',
    'meetups.openPlan': 'Қызығушылық тобын ашу',
    'meetups.peoplePlansDisclaimer': 'Жоспарларды қызығушылық топтарының мүшелері ұсынады, TUSA ұйымдастырмайды. Мәліметтерді автордан нақтылаңыз; белгі қатысуды кепілдемейді.',
    'meetups.peoplePlansEmpty': 'Әзірге қатысушылар ұсынған жақын кездесулер жоқ. Қызығушылық тобында өз жоспарыңызды ұсыныңыз.',
    'meetups.proposePlan': 'Қызығушылықты тауып, кездесу ұсыну',
    'nav.calendar': 'Күнтізбе',
    'nav.map': 'Қала картасы',
    'nav.tickets': 'Билеттерім',
    'nav.profile': 'Профиль',
    'nav.publish': 'Іс-шақты орналастыру',
    'nav.terms': 'Шарттар',
    'nav.section': 'Мәзір',
    'nav.mainAria': 'Негізгі мәзір',
    'theme.switchToDark': 'Қараңғы тақырыпты қосу',
    'theme.switchToLight': 'Ашық тақырыпты қосу',
    'breadcrumb.home': 'Басты бет',
    'breadcrumb.events': 'Іс-шақтар',
    'breadcrumb.meetups': 'Бірге',
    'breadcrumb.calendar': 'Күнтізбе',
    'breadcrumb.event': 'Іс-шақ',
    'breadcrumb.ticket': 'Билет',
    'breadcrumb.orders': 'Тапсырыстар',
    'breadcrumb.review': 'Өтінімдерді тексеру',
    'breadcrumb.botMessages': 'Бот хабарламалары',
    'breadcrumb.analytics': 'Пилот аналитикасы',
    'breadcrumb.map': 'Қала картасы',
    'breadcrumb.tickets': 'Билеттер мұрағаты',
    'breadcrumb.groups': 'Қауымдастықтар',
    'breadcrumb.createEvent': 'Жаңа іс-шақ',
    'breadcrumb.profile': 'Профиль',
    'breadcrumb.terms': 'Шарттар',
    'home.whatToday': 'Бүгін не іздейсіз?',
    'home.findEvent': 'Іс-шақты табу',
    'home.createEvent': 'Іс-шақты жасау',
    'home.intro': 'Астанадағы іс-шақты тап немесе қала афишасына өзіңді қос.',
    'home.footer': 'Қала жақын жердегі оқиғадан басталады.',
    'calendar.title': 'Астана афишасы',
    'calendar.subtitle': 'Күнді таңдап, барғыңыз келетін іс-шақты табыңыз.',
    'calendar.month': 'Ай',
    'calendar.week': 'Апта',
    'calendar.today': 'Бүгін',
    'calendar.noEvents': 'Бұл күнге әзірге жарияланған іс-шақ жоқ.',
    'calendar.allEvents': 'Барлық іс-шақтар',
    'calendar.organizer': 'Сіз ұйымдастырушысыз ба?',
    'calendar.terms': 'Шарттар мен ережелер',
    'calendar.demoNotice': 'Демо іс-шақтар көрсетіліп тұр. Мәліметтер тек осы қолданбада сақталады және нақты сатылымды білдірмейді.',
    'map.demoNotice': 'Демо карта · үлгі іс-шақтар',
    'events.heading': 'Бүгін қайда?',
    'events.allTitle': 'Іс-шақтар афишасы',
    'events.subtitle': 'Астанадағы жақын күндердің іс-шақтары. Ақпаратты қарап, жоспармен бөлісіп, қызығушылығыңызды белгілеңіз.',
    'events.organizer': 'Ұйымдастырушылар: іс-шақты тегін орналастырыңыз',
    'events.hobbies': 'Хобби мен клубтар',
    'communities.heading': 'Қауымдастықтар',
    'communities.subtitle': 'Қаладағы жаңа іс-шақтар жарияланатын қауымдастықтар мен арналар.',
    'communities.disclaimer': 'Бұл — тәуелсіз қауымдастықтар. Ережелері мен шарттарын әкімшілерінен нақтылаңыз.',
    'communities.empty': 'Қауымдастықтар жақында пайда болады. TUSA жаңалықтарын бақылаңыз.',
    'communities.openTelegram': 'Telegram-ды ашу',
    'communities.boardGamesDescription': 'Астанадағы үстел ойындары клубы.',
    'analytics.heading': 'Пилот аналитикасы',
    'analytics.description': 'Қолданбадағы әрекеттер есептеледі. Қайта ашулар болуы мүмкін; Telegram-ға өту топқа қосылуды, RSVP-ті не сатылымды білдірмейді.',
    'analytics.summary': 'Воронка оқиғаларының жиынтығы',
    'analytics.refresh': 'Жаңарту',
    'analytics.loading': 'Жиынтық жүктелуде…',
    'analytics.loadError': 'Аналитиканы жүктеу мүмкін болмады',
    'analytics.adminRequired': 'Telegram арқылы TUSA әкімшісі ретінде кіру және API қосылымы қажет.',
    'analytics.retry': 'Қайталау',
    'analytics.catalogViews': 'Афишаны ашу',
    'analytics.repeatedViewsNote': 'Қайта ашулар есептеледі',
    'analytics.eventOpens': 'Іс-шақтарды ашу',
    'analytics.eventOpensNote': 'Іс-шақ карточкалары',
    'analytics.shares': 'Сілтемелерді жіберу',
    'analytics.sharesNote': 'Іс-шақты бөлісу әрекеттері',
    'analytics.communityClicks': 'Қауымдастықтарға өту',
    'analytics.communityClicksNote': 'Сыртқы сілтемелерді басу',
    'analytics.meetupShares': 'Жоспарларды бөлісу',
    'analytics.meetupSharesNote': 'Орын мен күнді бөлісу әрекеттері',
    'analytics.meetupInviteOpens': 'Шақыруларды ашу',
    'analytics.meetupInviteOpensNote': 'Қайта ашулар есептеледі',
    'analytics.campaigns': 'Seed-host пилотының арналары',
    'analytics.noCampaigns': 'Әзірге науқан коды бар оқиғалар жоқ.',
    'analytics.campaignsNote': 'Кодтарда есімдер мен username жоқ; host-пен сәйкестік тізімін бөлек сақтаңыз. Қайта ашулар бөлек саналады; метрика бірегей адамдарды, жеткізуді немесе қатысуды көрсетпейді.',
    'analytics.linkBuilder': 'Host үшін сілтеме жасау',
    'analytics.venuesLoading': 'Ашық орындар каталогы жүктелуде…',
    'analytics.venuesUnavailable': 'Орындар каталогы әзірге қолжетімсіз. Бетті жаңартып көріңіз.',
    'analytics.venueLabel': 'Орын',
    'analytics.dateLabel': 'Жоспар күні',
    'analytics.channelLabel': 'Арна коды',
    'analytics.openGeneratedLink': 'Сілтемені ашу ↗',
    'analytics.copyLink': 'Сілтемені көшіру',
    'analytics.linkCopied': 'Сілтеме көшірілді.',
    'analytics.linkCopyFailed': 'Көшіру мүмкін болмады. Сілтемені ашыңыз немесе қолмен көшіріңіз.',
    'analytics.linkBuilderNote': 'Кодты тек host келісім бергеннен кейін тағайындаңыз. Сілтеме жоспарды, броньды немесе қатысуды растамайды.',
    'analytics.caveat': '«Қауымдастықтарға өту» — Telegram-сілтемесін басу саны, қосылған адамдар саны емес. RSVP — қызығушылық белгісі, билет емес.',
    'analytics.backToProfile': '← Профильге',
    'events.searchPlaceholder': 'Атауы, орын немесе сипаттама',
    'events.filters.all': 'Барлық санаттар',
    'events.filters.free': 'Бесплатно',
    'events.filters.under5000': '5 000 ₸-ға дейін',
    'events.price.fromOrganizer': 'Ұйымдастырушы көрсеткен баға',
    'events.price.freeByOrganizer': 'Ұйымдастырушы мәліметі бойынша тегін',
    'events.price.contactOrganizer': 'Қатысу шарттарын ұйымдастырушыдан нақтылаңыз',
    'events.details.place': 'Өтетін орны',
    'events.details.price': 'Бағасы',
    'events.details.organizerInfo': 'Ақпаратты ұйымдастырушы ұсынған',
    'events.details.rsvpPolicy': 'RSVP — қызығушылық белгісі, билет не бронь емес. Кіру шарттарын ұйымдастырушыдан нақтылаңыз.',
    'events.details.demoNotice': 'Демо мысал. Іс-шақ пен шарттар расталмаған.',
    'events.details.rsvp': 'Қызығамын',
    'events.details.rsvpSaved': 'Қызығушылығыңызды белгіледіңіз',
    'events.details.rsvpSaving': 'Сақталуда…',
    'events.details.telegramPrompt': 'Қызығушылықты белгілеу үшін TUSA-ны Telegram-да ашыңыз.',
    'events.details.rsvpError': 'Белгіні сақтау мүмкін болмады. Байланысты тексеріп, қайталап көріңіз.',
    'events.details.share': 'Іс-шақпен бөлісу',
    'events.details.shareCopied': 'Сілтеме көшірілді',
    'events.details.shareFailed': 'Бөлісу мүмкін болмады',
    'events.details.shareMaterials': 'Жариялауға арналған материалдар',
    'events.details.copy': 'Мәтінді көшіру',
    'events.details.copied': 'Мәтін көшірілді',
    'events.details.notFound': 'Іс-шақ табылмады.',
    'events.loading': 'Іс-шақтар жүктелуде…',
    'events.empty': 'Сәйкес іс-шақтар әлі жоқ',
    'events.retry': 'Қайталау',
    'events.reset': 'Фильтрлерді қалпына келтіру',
    'events.demo': 'Мысал',
    'events.promo': 'Промо',
    'events.illustrative': 'Иллюстрация',
    'checkout.heading': 'Сатып алу туралы ақпарат',
    'checkout.acceptTerms': 'Мен оқып шықтым және келісемін',
    'checkout.continue': 'Сатып алу өшірулі',
    'checkout.hint': 'TUSA офлайн іс-шақтарға билет сатпайды және кіру ақысын қабылдамайды. Қосылған цифрлық қызметтер тек Telegram Stars арқылы төленеді.',
    'checkout.unavailable': 'Офлайн билеттерді сатып алу өшірулі',
    'checkout.support': 'Қолдау қызметіне жазылу',
    'tickets.heading': 'Билеттер мұрағаты',
    'tickets.legacyNotice': 'Мұнда бұрын рәсімделген билеттер көрсетіледі. TUSA офлайн кіру билеттерін сатпайды; RSVP билет болып саналмайды.',
    'tickets.empty': 'Бұрын рәсімделген билет жоқ. RSVP кіру орнын брондамайды.',
    'tickets.catalog': 'Іс-шақтар каталогын ашу',
    'tickets.status.paid': 'Төленді',
    'tickets.status.pending': 'Шот берілді',
    'tickets.status.checkout': 'Төлемді растауда',
    'tickets.status.failed': 'Төлем қатесі',
    'tickets.status.refunded': 'Қайтару жасалды',
    'tickets.status.refundRequested': 'Қайтару тексеруде',
    'tickets.status.expired': 'Шот мерзімі аяқталды',
    'tickets.status.unknown': 'Статус уточняется',
    'tickets.open': 'Іс-шақ туралы',
    'tickets.entryCode': 'Кіру коды:',
    'tickets.demoNotice': 'Демо билет. Бұл QR-кодпен іс-шаққа кіруге болмайды.',
    'orders.heading': 'Заказы',
    'orders.subtitle': 'Оқиғаларыңыз бойынша сатылымдар және әкімшілік шолу.',
    'orders.sales': 'Түсім',
    'orders.tickets': 'Билеттер',
    'orders.events': 'Іс-шақтар',
    'orders.createNew': 'Жаңа іс-шақты орналастыру',
    'orders.noOrders': 'Сіздің іс-шақтарыңыз бойынша тапсырыстар әлі жоқ. TUSA-ға Telegram арқылы кіріңіз.',
  },
  en: {
    'nav.events': 'Events',
    'nav.meetups': 'Together',
    'meetups.peoplePlansKicker': 'FROM THE COMMUNITY',
    'meetups.peoplePlansTitle': 'Plans and meetups',
    'meetups.allInterests': 'All interests',
    'meetups.peoplePlansLoading': 'Finding upcoming community meetups…',
    'meetups.peoplePlansUnavailable': 'Could not load community meetups. The venue list is still available below.',
    'meetups.peopleGoing': 'going',
    'meetups.openPlan': 'Open interest group',
    'meetups.peoplePlansDisclaimer': 'Plans are proposed by interest-group members, not organized by TUSA. Confirm details with the host; an RSVP does not guarantee attendance.',
    'meetups.peoplePlansEmpty': 'No upcoming member-created meetups yet. Propose a plan in an interest group.',
    'meetups.proposePlan': 'Find an interest and propose a meetup',
    'nav.calendar': 'Calendar',
    'nav.map': 'City map',
    'nav.tickets': 'My tickets',
    'nav.profile': 'Profile',
    'nav.publish': 'Publish event',
    'nav.terms': 'Terms',
    'nav.section': 'Menu',
    'nav.mainAria': 'Main navigation',
    'theme.switchToDark': 'Switch to dark theme',
    'theme.switchToLight': 'Switch to light theme',
    'breadcrumb.home': 'Home',
    'breadcrumb.events': 'Events',
    'breadcrumb.meetups': 'Together',
    'breadcrumb.calendar': 'Calendar',
    'breadcrumb.event': 'Event',
    'breadcrumb.ticket': 'Ticket',
    'breadcrumb.orders': 'Orders',
    'breadcrumb.review': 'Submission review',
    'breadcrumb.botMessages': 'Bot messages',
    'breadcrumb.analytics': 'Pilot analytics',
    'breadcrumb.map': 'City map',
    'breadcrumb.tickets': 'Ticket archive',
    'breadcrumb.groups': 'Communities',
    'breadcrumb.createEvent': 'New event',
    'breadcrumb.profile': 'Profile',
    'breadcrumb.terms': 'Terms',
    'home.whatToday': 'What are you looking for',
    'home.findEvent': 'Find an event',
    'home.createEvent': 'Create an event',
    'home.intro': 'Find an event in Astana or add your own to the city listings.',
    'home.footer': 'The city begins with what happens nearby.',
    'calendar.title': 'Astana events',
    'calendar.subtitle': 'Choose a date and find an event you would love to attend.',
    'calendar.month': 'Month',
    'calendar.week': 'Week',
    'calendar.today': 'Today',
    'calendar.noEvents': 'No events have been published for this date yet.',
    'calendar.allEvents': 'All events',
    'calendar.organizer': 'Are you an organizer?',
    'calendar.terms': 'Terms and policies',
    'calendar.demoNotice': 'Showing demo events. These examples are stored only in this app and do not represent real ticket sales.',
    'map.demoNotice': 'Demo map · sample events',
    'events.heading': 'What’s happening?',
    'events.allTitle': 'Events in Astana',
    'events.subtitle': 'Astana events for the next few days. See the details, share a plan, and RSVP for free.',
    'events.organizer': 'For organizers: publish an event for free',
    'events.hobbies': 'Hobbies & clubs',
    'communities.heading': 'Communities',
    'communities.subtitle': 'Local communities and channels where new events are shared.',
    'communities.disclaimer': 'These are independent communities; check their rules and terms with their admins.',
    'communities.empty': 'Community listings are coming soon. Follow TUSA for updates.',
    'communities.openTelegram': 'Open Telegram',
    'communities.boardGamesDescription': 'Board-game club in Astana.',
    'analytics.heading': 'Pilot analytics',
    'analytics.description': 'We count actions in the app. Repeat opens are possible; opening Telegram does not mean joining a group, RSVPing, or making a purchase.',
    'analytics.summary': 'Funnel event totals',
    'analytics.refresh': 'Refresh',
    'analytics.loading': 'Loading summary…',
    'analytics.loadError': 'Could not load analytics',
    'analytics.adminRequired': 'Open TUSA in Telegram as an administrator and check the API connection.',
    'analytics.retry': 'Retry',
    'analytics.catalogViews': 'Event catalog opens',
    'analytics.repeatedViewsNote': 'Repeat opens are included',
    'analytics.eventOpens': 'Event page opens',
    'analytics.eventOpensNote': 'Event detail pages',
    'analytics.shares': 'Link shares',
    'analytics.sharesNote': 'Attempts to share an event',
    'analytics.communityClicks': 'Community link clicks',
    'analytics.communityClicksNote': 'Clicks on external links',
    'analytics.meetupShares': 'Plan share intents',
    'analytics.meetupSharesNote': 'Attempts to share a place and date',
    'analytics.meetupInviteOpens': 'Invite link opens',
    'analytics.meetupInviteOpensNote': 'Repeat opens are included',
    'analytics.campaigns': 'Seed-host pilot channels',
    'analytics.noCampaigns': 'No campaign-tagged events yet.',
    'analytics.campaignsNote': 'Codes contain no names or usernames; keep any host mapping separately. Repeat opens count separately; these metrics do not show unique people, delivery, or attendance.',
    'analytics.linkBuilder': 'Build a host link',
    'analytics.venuesLoading': 'Loading the public venue catalog…',
    'analytics.venuesUnavailable': 'The venue catalog is unavailable. Try refreshing the page.',
    'analytics.venueLabel': 'Venue',
    'analytics.dateLabel': 'Plan date',
    'analytics.channelLabel': 'Channel code',
    'analytics.openGeneratedLink': 'Open link ↗',
    'analytics.copyLink': 'Copy link',
    'analytics.linkCopied': 'Link copied.',
    'analytics.linkCopyFailed': 'Could not copy. Open the link or copy it manually.',
    'analytics.linkBuilderNote': 'Assign a code only after the host agrees. A link does not confirm a plan, reservation, or attendance.',
    'analytics.caveat': '“Community link clicks” counts clicks on external Telegram links, not group joins. RSVP expresses interest; it is not a ticket.',
    'analytics.backToProfile': '← Back to profile',
    'events.searchPlaceholder': 'Event name, venue, or description',
    'events.filters.all': 'All categories',
    'events.filters.free': 'Free',
    'events.filters.under5000': 'Up to 5,000 ₸',
    'events.price.fromOrganizer': 'Organizer-stated price',
    'events.price.freeByOrganizer': 'Free per organizer',
    'events.price.contactOrganizer': 'Ask the organizer about admission',
    'events.details.place': 'Venue',
    'events.details.price': 'Price',
    'events.details.organizerInfo': 'Information provided by the organizer',
    'events.details.rsvpPolicy': 'RSVP is an expression of interest, not a ticket or reservation. Ask the organizer about admission.',
    'events.details.demoNotice': 'Demo example. Event details and admission are not confirmed.',
    'events.details.rsvp': 'I’m interested',
    'events.details.rsvpSaved': 'Interest noted',
    'events.details.rsvpSaving': 'Saving…',
    'events.details.telegramPrompt': 'Open TUSA in Telegram to express interest.',
    'events.details.rsvpError': 'Could not save your response. Check your connection and try again.',
    'events.details.share': 'Share event',
    'events.details.shareCopied': 'Link copied',
    'events.details.shareFailed': 'Could not share',
    'events.details.shareMaterials': 'Share materials',
    'events.details.copy': 'Copy text',
    'events.details.copied': 'Text copied',
    'events.details.notFound': 'Event not found.',
    'events.loading': 'Loading events…',
    'events.empty': 'No matching events yet',
    'events.retry': 'Retry',
    'events.reset': 'Reset filters',
    'events.demo': 'Sample',
    'events.promo': 'Promo',
    'events.illustrative': 'Illustration',
    'checkout.heading': 'Purchase information',
    'checkout.acceptTerms': 'I have read and accept',
    'checkout.continue': 'Purchases are disabled',
    'checkout.hint': 'TUSA does not sell admission to in-person events or collect entry fees. Paid digital services, if enabled, are paid only in Telegram Stars.',
    'checkout.unavailable': 'In-person ticket sales are disabled',
    'checkout.support': 'Contact support',
    'tickets.heading': 'Ticket archive',
    'tickets.legacyNotice': 'Previously issued tickets appear here. TUSA no longer sells in-person admission; RSVP is not a ticket.',
    'tickets.empty': 'No previously issued tickets. RSVP does not reserve admission.',
    'tickets.catalog': 'Open event catalog',
    'tickets.status.paid': 'Paid',
    'tickets.status.pending': 'Invoice sent',
    'tickets.status.checkout': 'Confirming payment',
    'tickets.status.failed': 'Payment failed',
    'tickets.status.refunded': 'Refunded',
    'tickets.status.refundRequested': 'Refund under review',
    'tickets.status.expired': 'Invoice expired',
    'tickets.status.unknown': 'Status pending',
    'tickets.open': 'View event',
    'tickets.entryCode': 'Entry code:',
    'tickets.demoNotice': 'Demo ticket. This QR code is not valid for event entry.',
    'orders.heading': 'Orders',
    'orders.subtitle': 'Sales for your events and a summary for administrators.',
    'orders.sales': 'Revenue',
    'orders.tickets': 'Tickets',
    'orders.events': 'Events',
    'orders.createNew': 'Publish a new event',
    'orders.noOrders': 'There are no orders for your events yet. Open TUSA from Telegram to access this view.',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>(this.getInitialLocale());

  constructor() {
    effect(() => {
      const current = this.locale();
      document.documentElement.lang = current;
      document.documentElement.setAttribute('data-locale', current);
      document.title = current === 'en' ? 'TUSA Astana' : current === 'kz' ? 'TUSA — Астана іс-шақтары' : 'TUSA — события Астаны';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('tusa-locale-preference-v1', current);
      }
    });
  }

  t(key: TranslationKey): string {
    const current = this.locale();
    return translations[current][key] ?? translations.ru[key] ?? key;
  }

  brandCity(): string {
    const current = this.locale();
    return current === 'en' ? 'Astana' : 'Астана';
  }

  setLocale(locale: Locale): void {
    this.locale.set(locale);
  }

  private getInitialLocale(): Locale {
    if (typeof window === 'undefined') return 'ru';
    const saved = window.localStorage.getItem('tusa-locale-preference-v1');
    if (saved === 'ru' || saved === 'kz' || saved === 'en') return saved;
    return 'ru';
  }
}
