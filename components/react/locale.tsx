import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ZehnLocale } from './format';

export type { ZehnLocale } from './format';

/** Every user-visible string the zehn components render on their own (visible text, aria-labels, sr-only text). */
export interface ZehnLabels {
  cancel: string;
  close: string;
  back: string;
  moreActions: string;
  retry: string;
  dismissNotification: string;
  notifications: string;
  notificationsUnread: (count: number) => string;
  previousPage: string;
  nextPage: string;
  pagination: string;
  tableControls: string;
  mainNav: string;
  /** AppSwitcher nav label. */
  apps: string;
  support: string;
  user: string;
  actions: string;
  actionsFor: (name: string) => string;
  loading: string;
  /** Screen-reader text for the Textarea "12/200" counter. */
  characterCount: (length: number, max: number) => string;
}

// Russian plural: one (1, 21…) · few (2–4, 22–24…) · many.
const ruPlural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

export const zehnLabels: Record<ZehnLocale, ZehnLabels> = {
  en: {
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    moreActions: 'More actions',
    retry: 'Retry',
    dismissNotification: 'Dismiss notification',
    notifications: 'Notifications',
    notificationsUnread: (n) => `Notifications, ${n} unread`,
    previousPage: 'Previous page',
    nextPage: 'Next page',
    pagination: 'Pagination',
    tableControls: 'Table controls',
    mainNav: 'Main',
    apps: 'Apps',
    support: 'Support',
    user: 'User',
    actions: 'Actions',
    actionsFor: (name) => `Actions for ${name}`,
    loading: 'Loading…',
    characterCount: (n, max) => `${n} of ${max} characters`,
  },
  ru: {
    cancel: 'Отмена',
    close: 'Закрыть',
    back: 'Назад',
    moreActions: 'Другие действия',
    retry: 'Повторить',
    dismissNotification: 'Закрыть уведомление',
    notifications: 'Уведомления',
    notificationsUnread: (n) => `Уведомления, ${n} ${ruPlural(n, 'непрочитанное', 'непрочитанных', 'непрочитанных')}`,
    previousPage: 'Предыдущая страница',
    nextPage: 'Следующая страница',
    pagination: 'Страницы',
    tableControls: 'Управление таблицей',
    mainNav: 'Основная навигация',
    apps: 'Приложения',
    support: 'Поддержка',
    user: 'Пользователь',
    actions: 'Действия',
    actionsFor: (name) => `Действия: ${name}`,
    loading: 'Загрузка…',
    characterCount: (n, max) => `Символов: ${n} из ${max}`,
  },
  uz: {
    cancel: 'Bekor qilish',
    close: 'Yopish',
    back: 'Orqaga',
    moreActions: 'Boshqa amallar',
    retry: 'Qayta urinish',
    dismissNotification: 'Bildirishnomani yopish',
    notifications: 'Bildirishnomalar',
    notificationsUnread: (n) => `Bildirishnomalar, ${n} ta o‘qilmagan`,
    previousPage: 'Oldingi sahifa',
    nextPage: 'Keyingi sahifa',
    pagination: 'Sahifalar',
    tableControls: 'Jadval boshqaruvi',
    mainNav: 'Asosiy menyu',
    apps: 'Ilovalar',
    support: 'Yordam',
    user: 'Foydalanuvchi',
    actions: 'Amallar',
    actionsFor: (name) => `${name}: amallar`,
    loading: 'Yuklanmoqda…',
    characterCount: (n, max) => `Belgilar: ${n} / ${max}`,
  },
};

interface ZehnLocaleValue {
  locale: ZehnLocale;
  labels: ZehnLabels;
}

const LocaleContext = createContext<ZehnLocaleValue>({ locale: 'en', labels: zehnLabels.en });

export interface ZehnLocaleProviderProps {
  locale: ZehnLocale;
  /** Override single strings, e.g. { support: 'Help' }. */
  labels?: Partial<ZehnLabels>;
  children: ReactNode;
}

/** Wrap the app once. Without it the components fall back to English. */
export function ZehnLocaleProvider({ locale, labels, children }: ZehnLocaleProviderProps) {
  const value = useMemo(() => ({ locale, labels: { ...zehnLabels[locale], ...labels } }), [locale, labels]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** The current label set (English without a provider). */
export function useZehnLabels(): ZehnLabels {
  return useContext(LocaleContext).labels;
}

/** The current locale, for formatDate / formatMoney etc. */
export function useZehnLocale(): ZehnLocale {
  return useContext(LocaleContext).locale;
}
