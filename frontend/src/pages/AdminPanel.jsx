import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import QRCode from 'qrcode';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Scissors,
  Calendar,
  Phone,
  MapPin,
  Plus,
  Trash2,
  LogOut,
  BarChart3,
  Clock,
  Clock3,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Edit2,
  Sparkles,
  XCircle,
  AlertCircle,
  ArrowRight,
  Building2,
  Users,
  Star,
  Power,
  QrCode,
  Download,
  Printer,
  Copy,
  GripVertical,
  CalendarDays,
  RotateCcw,
  Menu,
  X,
  ChevronDown,
  Moon,
  Sun
} from 'lucide-react';
import { formatToman, toPersianNumber } from '../utils/formatCurrency';
import ManageReviews from '../components/ManageReviews';
import PortfolioManager from '../components/PortfolioManager';



const WEEK_DAY_OPTIONS = [
  { value: '0', label: 'شنبه' },
  { value: '1', label: 'یکشنبه' },
  { value: '2', label: 'دوشنبه' },
  { value: '3', label: 'سه‌شنبه' },
  { value: '4', label: 'چهارشنبه' },
  { value: '5', label: 'پنج‌شنبه' },
  { value: '6', label: 'جمعه' },
];

const WORKING_HOUR_PRESETS = [
  {
    key: 'morning',
    label: 'صبح کاری',
    icon: '☀️',
    shifts: [{ start_time: '09:00', end_time: '13:00' }],
  },
  {
    key: 'afternoon',
    label: 'بعدازظهر',
    icon: '🌤️',
    shifts: [{ start_time: '13:00', end_time: '17:00' }],
  },
  {
    key: 'split',
    label: 'صبح / عصر',
    icon: '✨',
    shifts: [
      { start_time: '09:00', end_time: '13:00' },
      { start_time: '16:00', end_time: '21:00' },
    ],
  },
  {
    key: 'full',
    label: 'تمام روز',
    icon: '⏰',
    shifts: [{ start_time: '09:00', end_time: '18:00' }],
  },
];

function generateTimeOptions(startHour = 6, endHour = 23, stepMinutes = 30) {
  const options = [];
  const pad = (value) => String(value).padStart(2, '0');

  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      if (hour === endHour && minute > 30) continue;
      if (hour === endHour && minute === 30) {
        options.push(`${pad(hour)}:${pad(minute)}`);
        continue;
      }
      if (hour < endHour) {
        options.push(`${pad(hour)}:${pad(minute)}`);
      }
    }
  }

  return options;
}

const TIME_OPTIONS = generateTimeOptions(6, 23, 30);

function makeShiftId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `shift-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createShift(start_time = '09:00', end_time = '17:00', serverId = null) {
  return {
    id: makeShiftId(),
    serverId, // شناسه واقعی از سرور (برای ویرایش/حذف)
    start_time,
    end_time,
  };
}

function createWorkingHourFormState() {
  return {
    selectedDays: ['0'],
    shifts: [createShift()],
  };
}

function normalizeTimeText(value) {
  return value ? String(value).slice(0, 5) : '';
}

function formatPriceInput(value) {
  const integerPart = String(value ?? '').split('.')[0];
  const digitsOnly = integerPart.replace(/[^\d]/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Convert Persian digits to ASCII and extract only digits
function parsePriceInput(value) {
  if (!value) return '';
  
  // Convert Persian/Farsi digits to ASCII
  let normalized = String(value)
    .replace(/۰/g, '0')
    .replace(/۱/g, '1')
    .replace(/۲/g, '2')
    .replace(/۳/g, '3')
    .replace(/۴/g, '4')
    .replace(/۵/g, '5')
    .replace(/۶/g, '6')
    .replace(/۷/g, '7')
    .replace(/۸/g, '8')
    .replace(/۹/g, '9')
    // Also handle Arabic-Indic digits
    .replace(/٠/g, '0')
    .replace(/١/g, '1')
    .replace(/٢/g, '2')
    .replace(/٣/g, '3')
    .replace(/٤/g, '4')
    .replace(/٥/g, '5')
    .replace(/٦/g, '6')
    .replace(/٧/g, '7')
    .replace(/٨/g, '8')
    .replace(/٩/g, '9');
  
  // Extract only ASCII digits
  const digitsOnly = normalized.replace(/[^\d]/g, '');
  return digitsOnly;
}


function formatWorkingRange(start_time, end_time) {
  return `${normalizeTimeText(start_time)} - ${normalizeTimeText(end_time)}`;
}

function getDayIndexFromValue(dayValue) {
  const index = WEEK_DAY_OPTIONS.findIndex((day) => String(day.value) === String(dayValue));
  return index >= 0 ? index : 0;
}

function cloneShiftList(shifts = []) {
  return shifts.map((shift) => createShift(shift.start_time, shift.end_time, shift.serverId || null));
}

function loadSavedShiftsForDay(workingHours, dayValue) {
  const saved = workingHours
    .filter((wh) => String(wh.day_of_week) === String(dayValue))
    .sort((a, b) => {
      const orderA = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : 9999;
      const orderB = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return normalizeTimeText(a.start_time).localeCompare(normalizeTimeText(b.start_time));
    });
  if (saved.length === 0) return [createShift()];
  return saved.map((wh) => createShift(normalizeTimeText(wh.start_time), normalizeTimeText(wh.end_time), wh.id));
}

function groupWorkingHoursByDay(workingHours) {
  return WEEK_DAY_OPTIONS.map((day) => {
    const shifts = workingHours
      .filter((item) => String(item.day_of_week) === String(day.value))
      .slice()
      .sort((a, b) => {
        const orderA = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : 9999;
        const orderB = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 9999;
        if (orderA !== orderB) return orderA - orderB;
        const startA = normalizeTimeText(a.start_time);
        const startB = normalizeTimeText(b.start_time);
        return startA.localeCompare(startB);
      });

    return {
      ...day,
      shifts,
    };
  });
}
export default function AdminPanel() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const TAB_META = {
    'overview': { label: 'خلاصه آماری', icon: <BarChart3 size={18} /> },
    'services': { label: 'خدمات', icon: <Scissors size={18} /> },
    'working-hours': { label: 'ساعات کاری', icon: <Clock size={18} /> },
    'bookings': { label: 'رزروها', icon: <Calendar size={18} /> },
    'reviews': { label: 'نظرات مشتریان', icon: <Star size={18} /> },
    'portfolio': { label: 'نمونه کارها', icon: <Sparkles size={18} /> },
    'owner-info': { label: 'مشخصات مالک', icon: <Users size={18} /> },
    'qr-code': { label: 'QR کد سالن', icon: <QrCode size={18} /> },
    'settings': { label: 'تنظیمات سالن', icon: <Building2 size={18} /> }
  };
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration_minutes: '30'
  });
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingService, setEditingService] = useState({
    name: '',
    price: '',
    duration_minutes: '30'
  });
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: '',
    message: ''
  });
  const [successModal, setSuccessModal] = useState({
    open: false,
    message: ''
  });
  const [newWorkingHour, setNewWorkingHour] = useState({
    selectedDays: ['0'],
    shifts: [createShift()]
  });
  const [showWorkingHourForm, setShowWorkingHourForm] = useState(false);
  const [draggedShiftIndex, setDraggedShiftIndex] = useState(null);
  const [toggleSalonLoading, setToggleSalonLoading] = useState(false);
  const [showDisableSalonForm, setShowDisableSalonForm] = useState(false);
  const [disableSalonForm, setDisableSalonForm] = useState({
    days: '',
    reason: ''
  });
  const [ownerImage, setOwnerImage] = useState(null);
  const [ownerImagePreview, setOwnerImagePreview] = useState(null);
  const [ownerDescription, setOwnerDescription] = useState('');
  const [savingOwnerInfo, setSavingOwnerInfo] = useState(false);
  // ویرایش تلفن/موبایل سالن (فقط مالک)
  const [showContactEditForm, setShowContactEditForm] = useState(false);
  const [contactForm, setContactForm] = useState({ phone: '', mobile: '' });
  const [savingContactInfo, setSavingContactInfo] = useState(false);
  const [contactInfoError, setContactInfoError] = useState('');
  // QR Code states
  const [qrCode, setQrCode] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  // image position controller
  const [showPositionEditor, setShowPositionEditor] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 }); // percent
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, posX: 50, posY: 50 });
  const positionEditorRef = useState(null);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'owner' && user?.role !== 'staff')) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAuthenticated, user]);

  // دریافت QR Code سالن - فقط برای مالک سالن
  useEffect(() => {
    // فقط owner می‌تواند QR Code داشته باشد (backend هم همین را enforce می‌کند)
    if (!user?.id || user?.role !== 'owner') return;

    const fetchQRCode = async () => {
      try {
        setQrLoading(true);
        setQrError(null);

        // استفاده از api.getQRCode که توکن auth را به درستی می‌فرستد
        const response = await api.getQRCode();
        const { qr_code, qr_url } = response.data;

        // اعتبارسنجی داده‌های دریافتی قبل از تولید QR
        if (!qr_url || typeof qr_url !== 'string' || qr_url.trim() === '') {
          throw new Error('آدرس QR Code معتبر نیست');
        }

        setQrCode(qr_code);
        setQrUrl(qr_url);

        // تولید تصویر QR Code با استفاده از Promise صریح
        const dataUrl = await new Promise((resolve, reject) => {
          QRCode.toDataURL(
            qr_url.trim(),
            {
              errorCorrectionLevel: 'H',
              type: 'image/png',
              width: 250,
              margin: 2,
            },
            (err, url) => {
              if (err) reject(err);
              else resolve(url);
            }
          );
        });

        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('خطا در دریافت QR Code:', err);
        // پیام خطای واضح‌تر بر اساس نوع خطا
        if (err.response?.status === 403) {
          setQrError('فقط مالک سالن می‌تواند QR Code را ببیند');
        } else if (err.response?.status === 401) {
          setQrError('لطفاً وارد حساب کاربری خود شوید');
        } else {
          setQrError(err.message || 'خطا در دریافت QR Code');
        }
      } finally {
        setQrLoading(false);
      }
    };

    fetchQRCode();
  }, [user?.id, user?.role]);

  const loadData = async () => {
    try {
      setLoading(true);
      const salonId = user?.salon?.id;
      if (salonId) {
        // ✅ ذخیره سالون انتخاب شده برای استفاده در سایر صفحات (مثلاً Booking)
        localStorage.setItem('selected_salon_id', salonId.toString());
        localStorage.setItem('selected_salon_name', user.salon.name || '');

        // Fetch fresh salon data to ensure is_currently_disabled is updated
        const salonRes = await api.getSalon(salonId);
        setSalon(salonRes.data);
        setContactForm({
          phone: salonRes.data?.phone || '',
          mobile: salonRes.data?.mobile || '',
        });

        // Set owner info
        if (salonRes.data?.owner_image) {
          setOwnerImagePreview(salonRes.data.owner_image);
        }
        if (salonRes.data?.owner_description) {
          setOwnerDescription(salonRes.data.owner_description);
        }
        // Load saved position from settings
        if (salonRes.data?.settings?.owner_image_position) {
          try {
            const pos = typeof salonRes.data.settings.owner_image_position === 'string'
              ? JSON.parse(salonRes.data.settings.owner_image_position)
              : salonRes.data.settings.owner_image_position;
            if (pos?.x !== undefined) setImagePosition(pos);
          } catch { }
        }

        const servicesRes = await api.getAdminServices();
        console.log('🔵 Services loaded:', servicesRes.data);
        console.log('🔵 Services count:', servicesRes.data?.length);
        if (servicesRes.data && servicesRes.data.length > 0) {
          console.log('🔵 First service:', servicesRes.data[0]);
          console.log('🔵 First service ID type:', typeof servicesRes.data[0].id);
          console.log('🔵 First service ID value:', servicesRes.data[0].id);
        }
        setServices(servicesRes.data || []);

        const bookingsRes = await api.getBookings(salonId);
        setBookings(bookingsRes.data || []);

        // Load working hours
        try {
          const workingHoursRes = await api.getWorkingHours(salonId);
          setWorkingHours(workingHoursRes.data || []);
        } catch (err) {
          console.error('Error loading working hours:', err);
          setWorkingHours([]);
        }
      }
      setError('');
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name.trim()) {
      setErrorModal({ open: true, title: 'نام خدمت', message: 'لطفاً نام خدمت را وارد کنید' });
      return;
    }

    const parsedPrice = parseFloat(newService.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setErrorModal({ open: true, title: 'قیمت خدمت', message: 'قیمت این سرویس باید بیشتر از صفر باشد' });
      return;
    }

    try {
      setLoading(true);
      await api.createService({
        name: newService.name,
        price: parsedPrice,
        duration_minutes: parseInt(newService.duration_minutes, 10) || 30,
        is_active: true
      });
      await loadData();
      setNewService({ name: '', price: '', duration_minutes: '30' });
      setShowServiceForm(false);
      setError('');
    } catch (err) {
      console.error('Error adding service', err);
      const nameError = err.response?.data?.name?.[0];
      if (nameError) {
        setErrorModal({
          open: true,
          title: 'خدمت تکراری',
          message: nameError
        });
      } else {
        const fallbackMessage =
          err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          'خطا در اضافه کردن خدمت';
        setErrorModal({
          open: true,
          title: 'خطا',
          message: fallbackMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };



  const handleEditService = (service) => {
    setEditingServiceId(service.id);
    setEditingService({
      name: service.name,
      price: parsePriceInput(service.price),
      duration_minutes: service.duration_minutes
    });
    setShowEditServiceModal(true);
  };

  const handleUpdateService = async () => {
    if (!editingService.name.trim()) {
      setErrorModal({ open: true, title: 'نام خدمت', message: 'لطفاً نام خدمت را وارد کنید' });
      return;
    }

    const parsedPrice = parseFloat(editingService.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setErrorModal({ open: true, title: 'قیمت خدمت', message: 'قیمت این سرویس باید بیشتر از صفر باشد' });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: editingService.name,
        price: parsedPrice,
        duration_minutes: parseInt(editingService.duration_minutes, 10) || 30
      };
      console.log('Updating service with payload:', payload);
      await api.updateService(editingServiceId, payload);
      await loadData();
      setEditingServiceId(null);
      setEditingService({ name: '', price: '', duration_minutes: '30' });
      setShowEditServiceModal(false);
      setError('');
    } catch (err) {
      console.error('Error updating service:', err);
      console.error('Error response data:', err.response?.data);
      const nameError = err.response?.data?.name?.[0];
      const priceError = err.response?.data?.price?.[0];
      const durationError = err.response?.data?.duration_minutes?.[0];
      const detailError = err.response?.data?.detail;
      const nonFieldError = err.response?.data?.non_field_errors?.[0];
      
      if (nameError) {
        setErrorModal({
          open: true,
          title: 'خطا در نام خدمت',
          message: nameError
        });
      } else if (priceError) {
        setErrorModal({
          open: true,
          title: 'خطا در قیمت',
          message: priceError
        });
      } else if (durationError) {
        setErrorModal({
          open: true,
          title: 'خطا در مدت زمان',
          message: durationError
        });
      } else {
        const fallbackMessage = detailError || nonFieldError || 'خطا در بروزرسانی خدمت';
        setErrorModal({
          open: true,
          title: 'خطا',
          message: fallbackMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingServiceId(null);
    setEditingService({ name: '', price: '', duration_minutes: '30' });
    setShowEditServiceModal(false);
  };

  const handleToggleServiceStatus = async (service) => {
    const hasValidPrice = Number(service?.price) > 0;
    if (!service.is_active && !hasValidPrice) {
      setErrorModal({
        open: true,
        title: 'قیمت سرویس',
        message: 'برای فعال‌سازی این سرویس، ابتدا قیمت آن را بیشتر از صفر وارد کنید.'
      });
      return;
    }

    try {
      setLoading(true);
      await api.updateService(service.id, {
        is_active: !service.is_active
      });
      await loadData();
      
      // Show success message
      setSuccessModal({
        open: true,
        message: service.is_active 
          ? `خدمت "${service.name}" غیرفعال شد. دیگر برای مشتریان نمایش داده نمی‌شود.`
          : `خدمت "${service.name}" فعال شد. اکنون برای مشتریان نمایش داده می‌شود.`
      });
    } catch (err) {
      console.error('Error updating service status:', err);
      console.error('Error response:', err.response);
      setError('خطا در بروزرسانی وضعیت خدمت');
    } finally {
      setLoading(false);
    }
  };


  const handleAddWorkingHourShift = () => {
    setNewWorkingHour((prev) => {
      if ((prev.shifts || []).length >= 2) return prev; // حداکثر 2 شیفت در هر روز
      return {
        ...prev,
        shifts: [...(prev.shifts || []), createShift()],
      };
    });
  };

  const handleApplyWorkingHourPreset = (preset) => {
    setNewWorkingHour((prev) => ({
      ...prev,
      shifts: (preset.shifts || []).map((shift) => createShift(shift.start_time, shift.end_time)),
    }));
  };

  const handleShiftDragStart = (event, index) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    setDraggedShiftIndex(index);
  };

  const handleShiftDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleShiftDrop = (dropIndex) => {
    setNewWorkingHour((prev) => {
      if (draggedShiftIndex === null || draggedShiftIndex === dropIndex) {
        return prev;
      }

      const nextShifts = [...prev.shifts];
      const [moved] = nextShifts.splice(draggedShiftIndex, 1);
      nextShifts.splice(dropIndex, 0, moved);
      return {
        ...prev,
        shifts: nextShifts,
      };
    });
    setDraggedShiftIndex(null);
  };

  const handleShiftDragEnd = () => {
    setDraggedShiftIndex(null);
  };

  const handleAddWorkingHour = async (e) => {
    e.preventDefault();

    const selectedDayValue = newWorkingHour.selectedDays?.[0];
    const shifts = Array.isArray(newWorkingHour.shifts) ? newWorkingHour.shifts : [];
    const currentDayIndex = getDayIndexFromValue(selectedDayValue);
    const currentDay = WEEK_DAY_OPTIONS[currentDayIndex] || WEEK_DAY_OPTIONS[0];
    const nextDay = WEEK_DAY_OPTIONS[currentDayIndex + 1] || null;

    if (selectedDayValue === undefined || selectedDayValue === null) {
      setError('لطفاً یک روز را انتخاب کنید');
      return;
    }

    if (!shifts.length) {
      setError('لطفاً حداقل یک شیفت اضافه کنید');
      return;
    }

    if (shifts.length > 2) {
      setError('حداکثر ۲ شیفت برای هر روز مجاز است');
      return;
    }

    const invalidShift = shifts.some(
      (shift) => !shift.start_time || !shift.end_time || shift.start_time >= shift.end_time
    );

    if (invalidShift) {
      setError('ساعت شروع باید قبل از ساعت پایان باشد');
      return;
    }

    try {
      setLoading(true);

      const selectedDayKey = String(selectedDayValue);

      // شیفت‌های فعلی این روز در سرور
      const existingServerShifts = workingHours.filter(
        (wh) => String(wh.day_of_week) === selectedDayKey
      );

      // شناسه‌های سرور که هنوز در فرم هستند
      const keptServerIds = new Set(
        shifts.filter((s) => s.serverId).map((s) => s.serverId)
      );

      // حذف شیفت‌هایی که از فرم برداشته شدن
      for (const existing of existingServerShifts) {
        if (!keptServerIds.has(existing.id)) {
          await api.deleteWorkingHour(existing.id);
        }
      }

      // ویرایش شیفت‌های موجود یا ایجاد شیفت‌های جدید
      for (const [index, shift] of shifts.entries()) {
        if (shift.serverId) {
          // ویرایش شیفت موجود
          await api.updateWorkingHour(shift.serverId, {
            start_time: shift.start_time,
            end_time: shift.end_time,
            sort_order: index,
          });
        } else {
          // ایجاد شیفت جدید
          await api.createWorkingHour({
            day_of_week: parseInt(selectedDayKey, 10),
            start_time: shift.start_time,
            end_time: shift.end_time,
            sort_order: index,
          });
        }
      }

      await loadData();

      if (nextDay) {
        setNewWorkingHour({
          selectedDays: [nextDay.value],
          shifts: loadSavedShiftsForDay(workingHours, nextDay.value),
        });
        setShowWorkingHourForm(true);
        setSuccess(`روز ${currentDay.label} ذخیره شد. حالا ${nextDay.label} را تنظیم کن.`);
      } else {
        setNewWorkingHour(createWorkingHourFormState());
        setShowWorkingHourForm(false);
        setSuccess(`ساعات کاری ${currentDay.label} با موفقیت ذخیره شد`);
      }

      setDraggedShiftIndex(null);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding working hour', err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.end_time?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        err.message ||
        'خطا در اضافه کردن ساعات کاری';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const performDeleteWorkingHour = async (id) => {
    try {
      setLoading(true);
      await api.deleteWorkingHour(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting working hour', err);
      setError('خطا در حذف ساعات کاری');
    } finally {
      setLoading(false);
      setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
    }
  };

  const handleDeleteWorkingHour = (id) => {
    setConfirmModal({
      open: true,
      title: 'حذف شیفت کاری',
      message: 'آیا مطمئنی که می‌خوای این شیفت رو حذف کنی؟',
      onConfirm: () => performDeleteWorkingHour(id)
    });
  };

  const handleToggleSalonStatus = async () => {
    const newStatus = !salon?.is_active;
    const confirmMessage = newStatus
      ? 'آیا می‌خواهید سالن را فعال کنید؟'
      : 'آیا می‌خواهید سالن را غیرفعال کنید؟';

    if (!window.confirm(confirmMessage)) return;

    try {
      setToggleSalonLoading(true);
      const response = await api.toggleSalonStatus(newStatus ? 'enable' : 'disable', null, '');
      setSalon(response.data.salon);
      setError('');
      setShowDisableSalonForm(false);
    } catch (err) {
      console.error('Error toggling salon status:', err);
      setError(err.response?.data?.message || 'خطا در تغییر وضعیت سالن');
    } finally {
      setToggleSalonLoading(false);
    }
  };

  const handleDisableSalon = async (e) => {
    e.preventDefault();
    if (!window.confirm('آیا از غیرفعال کردن سالن مطمئن هستید؟')) return;

    try {
      setToggleSalonLoading(true);
      const days = disableSalonForm.days ? parseInt(disableSalonForm.days, 10) : null;
      const response = await api.toggleSalonStatus('disable', days, disableSalonForm.reason);
      setSalon(response.data.salon);
      setError('');
      setShowDisableSalonForm(false);
      setDisableSalonForm({ days: '', reason: '' });
    } catch (err) {
      console.error('Error disabling salon:', err);
      setError(err.response?.data?.message || 'خطا در غیرفعال کردن سالن');
    } finally {
      setToggleSalonLoading(false);
    }
  };

  const handleOwnerImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('سایز عکس نباید از 5 مگابایت بیشتر باشد');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('فقط عکس های JPEG, PNG, WebP و GIF پذیرفتنی هستند');
        return;
      }

      setOwnerImage(file);
      setImagePosition({ x: 50, y: 50 }); // reset position on new image

      // Create preview and open position editor
      const reader = new FileReader();
      reader.onload = (event) => {
        setOwnerImagePreview(event.target.result);
        setShowPositionEditor(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag handlers for position editor
  const handleEditorMouseDown = (e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY, posX: imagePosition.x, posY: imagePosition.y });
  };

  const handleEditorMouseMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    // Moving mouse right → image shifts right → objectPosition x decreases
    const newX = Math.min(100, Math.max(0, dragStart.posX - (dx / rect.width) * 100));
    const newY = Math.min(100, Math.max(0, dragStart.posY - (dy / rect.height) * 100));
    setImagePosition({ x: newX, y: newY });
  };

  const handleEditorMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveOwnerInfo = async (e) => {
    e.preventDefault();

    // حداکثر ۵۰۰ کاراکتر برای توضیح
    if (ownerDescription?.length > 500) {
      setErrorModal({
        open: true,
        title: 'خطا در ذخیره مشخصات',
        message: 'توضیح درباره خود نباید بیشتر از ۵۰۰ کاراکتر باشد.'
      });
      return;
    }

    if (!ownerDescription?.trim() && !ownerImage) {
      setErrorModal({
        open: true,
        title: 'خطا در ذخیره مشخصات',
        message: 'لطفا حداقل یک مورد (عکس یا توضیح) را وارد کنید.'
      });
      return;
    }

    try {
      setSavingOwnerInfo(true);
      const formData = new FormData();

      if (ownerImage) {
        formData.append('owner_image', ownerImage);
      }
      if (ownerDescription?.trim()) {
        formData.append('owner_description', ownerDescription.trim());
      }
      // ذخیره position به عنوان JSON در settings
      formData.append('owner_image_position', JSON.stringify(imagePosition));

      const response = await api.updateSalon(user.salon.id, formData);
      setSalon(response.data);

      // Update previews
      if (response.data?.owner_image) {
        setOwnerImagePreview(response.data.owner_image);
      }
      if (response.data?.owner_description) {
        setOwnerDescription(response.data.owner_description);
      }

      setOwnerImage(null);
      setShowPositionEditor(false);
      setError('');
      // نمایش مودال موفقیت
      setSuccessModal({
        open: true,
        message: 'مشخصات مالک با موفقیت ذخیره شد'
      });
    } catch (err) {
      console.error('Error saving owner info:', err);
      setErrorModal({
        open: true,
        title: 'خطا در ذخیره مشخصات',
        message: err.response?.data?.message || 'خطا در ذخیره اطلاعات مالک'
      });
    } finally {
      setSavingOwnerInfo(false);
    }
  };

  const handleSaveContactInfo = async (e) => {
    e.preventDefault();

    const trimmedPhone = contactForm.phone.trim();
    const trimmedMobile = contactForm.mobile.trim();

    if (!trimmedMobile) {
      setContactInfoError('شماره موبایل الزامی است');
      setErrorModal({
        open: true,
        title: 'شماره موبایل الزامی است',
        message: 'برای ذخیره اطلاعات، وارد کردن شماره موبایل الزامی است.'
      });
      return;
    }

    try {
      setSavingContactInfo(true);
      setContactInfoError('');

      const response = await api.updateSalon(user.salon.id, {
        phone: trimmedPhone || null,
        mobile: trimmedMobile,
      });

      setSalon(response.data);
      setContactForm({
        phone: response.data?.phone || '',
        mobile: response.data?.mobile || '',
      });
      setShowContactEditForm(false);
      setError('');
      setSuccess('شماره‌های تماس با موفقیت ذخیره شد');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving contact info:', err);
      const apiError =
        err.response?.data?.mobile?.[0] ||
        err.response?.data?.phone?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'شماره وارد شده قبلاً برای سالن دیگری ثبت شده است یا معتبر نیست.';

      setContactInfoError(apiError);
      setErrorModal({
        open: true,
        title: 'خطا در ذخیره شماره تماس',
        message: apiError,
      });
    } finally {
      setSavingContactInfo(false);
    }
  };

  const getStats = () => {
    return {
      totalServices: services.length,
      activeServices: services.filter(s => s.is_active).length,
      totalBookings: bookings.length,
      todayBookings: bookings.filter(b => {
        const bookingDate = new Date(b.start_at).toDateString();
        const today = new Date().toDateString();
        return bookingDate === today;
      }).length
    };
  };

  const stats = getStats();
  const workingHoursByDay = groupWorkingHoursByDay(workingHours);
  const activeWorkingDays = workingHoursByDay.filter((day) => day.shifts.length > 0).length;
  const multiShiftDays = workingHoursByDay.filter((day) => day.shifts.length > 1).length;
  const currentWizardDayValue = newWorkingHour.selectedDays?.[0] || WEEK_DAY_OPTIONS[0].value;
  const currentWizardDayIndex = getDayIndexFromValue(currentWizardDayValue);
  const currentWizardDay = WEEK_DAY_OPTIONS[currentWizardDayIndex] || WEEK_DAY_OPTIONS[0];
  const nextWizardDay = WEEK_DAY_OPTIONS[currentWizardDayIndex + 1] || null;
  const currentWizardShifts = Array.isArray(newWorkingHour.shifts) ? newWorkingHour.shifts : [];

  if (!isAuthenticated) return <Loading />;

  if (user?.role !== 'owner' && user?.role !== 'staff') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        padding: '20px'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'var(--card)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            border: "1px solid var(--border)"
          }}
        >
          <Alert type="error" message="دسترسی رد شد. فقط مالک و کارمند می‌توانند وارد شوند." />
          <Button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            بازگشت به صفحه اصلی
          </Button>
        </motion.div>
      </div>
    );
  }

  if (loading && !services.length && !bookings.length) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        direction: 'rtl'
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .admin-main-container {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .admin-aside {
            position: static !important;
            top: auto !important;
            display: none;
          }
          .admin-aside-open {
            display: block !important;
          }
          .admin-mobile-menu-toggle {
            display: flex !important;
          }
          .admin-table {
            min-width: 0 !important;
            overflow-x: auto !important;
          }
          .admin-table table {
            min-width: 100% !important;
          }
          .admin-table td, .admin-table th {
            padding: 0.5rem 0.75rem !important;
          }
          .admin-stat-cards {
            grid-template-columns: 1fr 1fr !important;
          }
          .admin-form-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-button-group {
            flex-direction: column !important;
          }
          .admin-button-group button {
            width: 100% !important;
          }
          .admin-header-content {
            flex-direction: column !important;
            gap: 1rem !important;
          }
          .admin-header-buttons {
            width: 100% !important;
          }
          .admin-header-buttons button {
            width: 100% !important;
            justify-content: center !important;
          }
          .admin-info-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-tab-button {
            font-size: 0.85rem !important;
            padding: 10px 12px !important;
          }
          .admin-edit-form-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-status-grid {
            grid-template-columns: 1fr !important;
          }
          .working-hour-shift-grid {
            grid-template-columns: 1fr !important;
          }
          .working-hour-preset-grid,
          .working-hour-day-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-section-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.5rem !important;
          }
          .admin-section-header button {
            width: 100% !important;
          }
          /* QR Code responsive */
          [style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .admin-stat-cards {
            grid-template-columns: 1fr !important;
          }
          .admin-table {
            overflow-x: auto !important;
            font-size: 0.65rem !important;
          }
          .admin-table table {
            font-size: 0.65rem !important;
            min-width: 100% !important;
          }
          .admin-table td, .admin-table th {
            padding: 0.4rem 0.5rem !important;
          }
          .admin-main-padding {
            padding: 1rem 0.75rem !important;
          }
          .admin-icon {
            width: 40px !important;
            height: 40px !important;
          }
          .admin-icon svg {
            width: 18px !important;
            height: 18px !important;
          }
        }
      `}</style>

      {/* هدر با گرادیانت */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
          padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        {/* المان‌های تزئینی */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-5%',
          width: '250px',
          height: '250px',
          background: 'var(--surface-glass)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-5%',
          width: '200px',
          height: '200px',
          background: 'var(--surface-glass-muted)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }} />

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          minHeight: '60px'
        }} className="admin-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '200px' }}>
            <motion.div
              initial={{ scale: 0.9, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                width: 'clamp(40px, 8vw, 56px)',
                height: 'clamp(40px, 8vw, 56px)',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                flexShrink: 0
              }}
            >
              <LayoutDashboard size={20} color="#FFFFFF" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  color: 'white',
                  fontSize: 'clamp(1.2rem, 4vw, 2rem)',
                  fontWeight: 800,
                  margin: 0,
                  textShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                پنل مدیریت
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                  margin: '4px 0 0 0'
                }}
              >
                خوش آمدید، {user?.username}
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="admin-header-buttons"
          >
            <button
              onClick={() => { logout(); navigate('/'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: 'clamp(8px, 2vw, 10px) clamp(16px, 3vw, 24px)',
                borderRadius: '50px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap',
                minWidth: '100px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <LogOut size={18} />
              خروج
            </button>
          </motion.div>
        </div>
      </motion.header>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(1rem, 3vw, 2rem) clamp(0.75rem, 2vw, 1.5rem)',
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 0.25fr) 1fr',
        gap: 'clamp(0.75rem, 2vw, 1.5rem)'
      }} className="admin-main-container">
        {/* دکمه باز/بسته کردن منو - فقط موبایل */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="admin-mobile-menu-toggle"
          style={{
            display: 'none',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
            cursor: 'pointer',
            color: "var(--text-primary)",
            fontSize: '0.92rem',
            fontWeight: 700
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {TAB_META[activeTab]?.icon}
            </span>
            {TAB_META[activeTab]?.label}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: "var(--text-secondary)" }}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </span>
        </button>

        {/* نوار کناری */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            position: 'sticky',
            top: '100px',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'hidden'
          }}
          className={`admin-aside${mobileMenuOpen ? ' admin-aside-open' : ''}`}
        >
          <div style={{
              background: 'var(--card)',
              borderRadius: '24px',
              padding: 'clamp(1rem, 2vw, 1.5rem)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* نوار گرادیانت بالا */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
              }} />
            <nav style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
              <TabButton
                icon={<BarChart3 size={20} />}
                label="خلاصه آماری"
                active={activeTab === 'overview'}
                onClick={() => handleTabClick('overview')}
              />
              <TabButton
                icon={<Scissors size={20} />}
                label="خدمات"
                badge={toPersianNumber(services.length)}
                active={activeTab === 'services'}
                onClick={() => handleTabClick('services')}
              />
              <TabButton
                icon={<Clock size={20} />}
                label="ساعات کاری"
                badge={toPersianNumber(workingHours.length)}
                active={activeTab === 'working-hours'}
                onClick={() => handleTabClick('working-hours')}
              />
              <TabButton
                icon={<Calendar size={20} />}
                label="رزروها"
                badge={toPersianNumber(bookings.length)}
                active={activeTab === 'bookings'}
                onClick={() => handleTabClick('bookings')}
              />
              <TabButton
                icon={<Star size={20} />}
                label="نظرات مشتریان"
                active={activeTab === 'reviews'}
                onClick={() => handleTabClick('reviews')}
              />
              <TabButton
                icon={<Sparkles size={20} />}
                label="نمونه کارها"
                active={activeTab === 'portfolio'}
                onClick={() => handleTabClick('portfolio')}
              />
              <TabButton
                icon={<Users size={20} />}
                label="مشخصات مالک"
                active={activeTab === 'owner-info'}
                onClick={() => handleTabClick('owner-info')}
              />
              <TabButton
                icon={<QrCode size={20} />}
                label="QR کد سالن"
                active={activeTab === 'qr-code'}
                onClick={() => handleTabClick('qr-code')}
              />
              <TabButton
                icon={<Building2 size={20} />}
                label="تنظیمات سالن"
                active={activeTab === 'settings'}
                onClick={() => handleTabClick('settings')}
              />
            </nav>
          </div>
        </motion.aside>

        {/* محتوای اصلی */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <Alert
                type="error"
                message={error}
                onClose={() => setError('')}
              />
            </motion.div>
          )}

          {/* تب خلاصه */}
          {activeTab === 'overview' && (
            <div>
              {/* کارت‌های آماری */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'clamp(0.75rem, 2vw, 1.5rem)',
                marginBottom: 'clamp(1rem, 3vw, 2rem)'
              }} className="admin-stat-cards">
                <StatCard
                  icon={<Scissors size={24} />}
                  value={stats.totalServices}
                  label="کل خدمات"
                  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  color="#667eea"
                />
                <StatCard
                  icon={<CheckCircle size={24} />}
                  value={stats.activeServices}
                  label="خدمات فعال"
                  gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  color="#10b981"
                />
                <StatCard
                  icon={<Calendar size={24} />}
                  value={stats.totalBookings}
                  label="کل رزروها"
                  gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  color="#f093fb"
                />
                <StatCard
                  icon={<TrendingUp size={24} />}
                  value={stats.todayBookings}
                  label="رزروهای امروز"
                  gradient="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                  color="#fbbf24"
                />
              </div>

              {/* اطلاعات سالن */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  background: 'var(--card)',
                  borderRadius: '24px',
                  padding: 'clamp(1rem, 3vw, 2rem)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  border: "1px solid var(--border)",
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)'
                }}>
                  <div style={{
                    width: 'clamp(36px, 6vw, 48px)',
                    height: 'clamp(36px, 6vw, 48px)',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
                    flexShrink: 0
                  }}>
                    <Building2 size={20} />
                  </div>
                  <h2 style={{
                    color: "var(--text-primary)",
                    fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                    fontWeight: 700,
                    margin: 0
                  }}>
                    اطلاعات سالن
                  </h2>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 'clamp(0.75rem, 2vw, 1.5rem)'
                }} className="admin-info-grid">
                  <InfoItem
                    icon={<Scissors size={20} />}
                    label="نام سالن"
                    value={salon?.name || '—'}
                    gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  />
                  <InfoItem
                    icon={<MapPin size={20} />}
                    label="شهر"
                    value={salon?.city || '—'}
                    gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  />
                  <InfoItem
                    icon={<Phone size={20} />}
                    label="تلفن"
                    value={salon?.phone || '—'}
                    gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                  />
                  <InfoItem
                    icon={<Phone size={20} />}
                    label="موبایل"
                    value={salon?.mobile || '—'}
                    gradient="linear-gradient(135deg, #34d399 0%, #10b981 100%)"
                  />
                </div>
              </motion.div>
            </div>
          )}

          {/* تب خدمات */}
          {activeTab === 'services' && (
            <div>
              {/* هدر بخش */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)',
                flexWrap: 'wrap',
                gap: 'clamp(0.5rem, 2vw, 1rem)'
              }} className="admin-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'min-content' }}>
                  <div style={{
                    width: 'clamp(36px, 6vw, 48px)',
                    height: 'clamp(36px, 6vw, 48px)',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
                    flexShrink: 0
                  }}>
                    <Scissors size={20} />
                  </div>
                  <div>
                    <h2 style={{
                      color: "var(--text-primary)",
                      fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                      fontWeight: 700,
                      margin: 0
                    }}>
                      مدیریت خدمات
                    </h2>
                    <p style={{
                      margin: '4px 0 0 0',
                      color: "var(--text-secondary)",
                      fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)'
                    }}>
                      خدمات سالن رو ببین، ویرایش کن یا فعال/غیرفعال کن.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setShowServiceForm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 28px)',
                    borderRadius: '50px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Plus size={18} />
                  خدمت جدید
                </Button>
              </div>

              {/* کارت‌های آماری */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }} className="working-hour-summary-grid">
                <div style={{
                  background: 'var(--card)',
                  borderRadius: '20px',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
                }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: '0.82rem', marginBottom: '0.35rem' }}>تعداد خدمات</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: "var(--text-primary)" }}>{toPersianNumber(services.length)}</div>
                </div>
                <div style={{
                  background: 'var(--card)',
                  borderRadius: '20px',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
                }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: '0.82rem', marginBottom: '0.35rem' }}>خدمات فعال</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: "var(--text-primary)" }}>
                    {toPersianNumber(services.filter((s) => s.is_active).length)}
                  </div>
                </div>
                <div style={{
                  background: 'var(--card)',
                  borderRadius: '20px',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
                }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: '0.82rem', marginBottom: '0.35rem' }}>خدمات غیرفعال</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: "var(--text-primary)" }}>
                    {toPersianNumber(services.filter((s) => !s.is_active).length)}
                  </div>
                </div>
              </div>

              {/* اطلاع‌رسانی */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  border: '1px solid #93c5fd',
                  borderRadius: '16px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#0284c7',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.65rem',
                  fontWeight: 800
                }}>
                  ℹ️
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: 0,
                    color: '#0c4a6e',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    fontWeight: 600
                  }}>
                    🔔 <strong>وقتی روی دکمه فعال/غیرفعال کلیک کنید:</strong>
                  </p>
                  <p style={{
                    margin: '0.5rem 0 0 0',
                    color: '#0c4a6e',
                    fontSize: '0.85rem',
                    lineHeight: 1.5
                  }}>
                    • اگر خدمت <strong>فعال</strong> است: برای مشتریان <strong>نمایش داده می‌شود</strong> و می‌توانند نوبت بگیرند<br/>
                    • اگر خدمت <strong>غیرفعال</strong> است: برای مشتریان <strong>نمایش داده نمی‌شود</strong> و نمی‌توانند نوبت بگیرند<br/>
                    • خدمت <strong>حذف نمی‌شود</strong> - فقط وضعیتش تغییر می‌کند
                  </p>
                </div>
              </motion.div>

              {/* فرم افزودن - مودال */}
              <AnimatePresence>
                {showServiceForm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 1000,
                      background: 'rgba(15, 23, 42, 0.56)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.75rem'
                    }}
                    onClick={() => {
                      setShowServiceForm(false);
                      setNewService({ name: '', price: '', duration_minutes: '30' });
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 10 }}
                      transition={{ duration: 0.22 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: 'min(560px, calc(100vw - 0.75rem))',
                        maxHeight: 'calc(100vh - 1.5rem)',
                        overflowY: 'auto',
                        background: 'var(--card)',
                        borderRadius: '28px',
                        boxShadow: '0 24px 90px rgba(15, 23, 42, 0.3)',
                        border: '1px solid var(--border)',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        height: '4px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                        borderTopLeftRadius: '28px',
                        borderTopRightRadius: '28px'
                      }} />

                      <div style={{ padding: 'clamp(1rem, 3vw, 1.75rem)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                          }}>
                            <Sparkles size={20} />
                          </div>
                          <h3 style={{
                            color: "var(--text-primary)",
                            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                            fontWeight: 800,
                            margin: 0
                          }}>
                            افزودن خدمت جدید
                          </h3>
                        </div>

                        <form onSubmit={handleAddService}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '1rem',
                            marginBottom: '1.5rem'
                          }}>
                            <FormField
                              label="نام خدمت"
                              type="text"
                              value={newService.name}
                              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                              placeholder="مثال: اصلاح مو"
                              required
                            />
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                              gap: '1rem'
                            }} className="admin-form-grid">
                              <PriceField
                                label="قیمت"
                                value={newService.price}
                                onChange={(val) => setNewService({ ...newService, price: val })}
                                placeholder="مثال: 500,000"
                                required
                              />
                              <FormField
                                label="مدت زمان (دقیقه)"
                                type="number"
                                value={newService.duration_minutes}
                                onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
                                placeholder="مثال: 30"
                                required
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }} className="admin-button-group">
                            <Button
                              type="button"
                              onClick={() => {
                                setShowServiceForm(false);
                                setNewService({ name: '', price: '', duration_minutes: '30' });
                              }}
                              style={{
                                padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 32px)',
                                borderRadius: '50px',
                                border: '2px solid #e2e8f0',
                                background: 'var(--card)',
                                color: "var(--text-secondary)",
                                fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--background-secondary)';
                                e.currentTarget.style.borderColor = '#94a3b8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--card)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                              }}
                            >
                              انصراف
                            </Button>
                            <Button
                              type="submit"
                              disabled={loading}
                              style={{
                                padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 32px)',
                                borderRadius: '50px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {loading ? 'در حال ذخیره...' : 'ذخیره خدمت'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* مودال ویرایش خدمت */}
              <AnimatePresence>
                {showEditServiceModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 1000,
                      background: 'rgba(15, 23, 42, 0.56)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.75rem'
                    }}
                    onClick={handleCancelEdit}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 10 }}
                      transition={{ duration: 0.22 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: 'min(560px, calc(100vw - 0.75rem))',
                        maxHeight: 'calc(100vh - 1.5rem)',
                        overflowY: 'auto',
                        background: 'var(--card)',
                        borderRadius: '28px',
                        boxShadow: '0 24px 90px rgba(15, 23, 42, 0.3)',
                        border: '1px solid var(--border)',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        height: '4px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
                        borderTopLeftRadius: '28px',
                        borderTopRightRadius: '28px'
                      }} />

                      <div style={{ padding: 'clamp(1rem, 3vw, 1.75rem)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                          }}>
                            <Edit2 size={20} />
                          </div>
                          <h3 style={{
                            color: "var(--text-primary)",
                            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                            fontWeight: 800,
                            margin: 0
                          }}>
                            ویرایش خدمت
                          </h3>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: '1rem',
                          marginBottom: '1.5rem'
                        }}>
                          <FormField
                            label="نام خدمت"
                            type="text"
                            value={editingService.name}
                            onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                            placeholder="مثال: اصلاح مو"
                            required
                          />
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '1rem'
                          }} className="admin-form-grid">
                            <PriceField
                              label="قیمت"
                              value={editingService.price}
                              onChange={(val) => setEditingService({ ...editingService, price: val })}
                              placeholder="مثال: 500,000"
                              required
                            />
                            <FormField
                              label="مدت زمان (دقیقه)"
                              type="number"
                              value={editingService.duration_minutes}
                              onChange={(e) => setEditingService({ ...editingService, duration_minutes: e.target.value })}
                              placeholder="مثال: 30"
                              required
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }} className="admin-button-group">
                          <Button
                            type="button"
                            onClick={handleCancelEdit}
                            style={{
                              padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 32px)',
                              borderRadius: '50px',
                              border: '2px solid #e2e8f0',
                              background: 'var(--card)',
                              color: "var(--text-secondary)",
                              fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--background-secondary)';
                              e.currentTarget.style.borderColor = '#94a3b8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--card)';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            انصراف
                          </Button>
                          <Button
                            type="button"
                            onClick={handleUpdateService}
                            disabled={loading}
                            style={{
                              padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 32px)',
                              borderRadius: '50px',
                              background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
                              color: 'white',
                              border: 'none',
                              fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
                              fontWeight: 600,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.6 : 1,
                              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* لیست خدمات - کارتی */}
              {services.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  style={{
                    background: 'var(--card)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    border: "1px solid var(--border)",
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: "var(--text-secondary)"
                  }}
                >
                  <Scissors size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: '0.5rem'
                  }}>
                    هنوز خدمتی ثبت نشده است
                  </p>
                  <p style={{ fontSize: '0.95rem' }}>
                    برای شروع، خدمت جدیدی اضافه کنید
                  </p>
                </motion.div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem'
                }} className="working-hour-day-grid">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onToggleStatus={handleToggleServiceStatus}
                      onEdit={() => handleEditService(service)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}


          {/* تب ساعات کاری */}
          {activeTab === 'working-hours' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)',
                flexWrap: 'wrap',
                gap: 'clamp(0.5rem, 2vw, 1rem)'
              }} className="admin-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'min-content' }}>
                  <div style={{
                    width: 'clamp(36px, 6vw, 48px)',
                    height: 'clamp(36px, 6vw, 48px)',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 6px 16px rgba(79, 172, 254, 0.3)',
                    flexShrink: 0
                  }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 style={{
                      color: "var(--text-primary)",
                      fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                      fontWeight: 700,
                      margin: 0
                    }}>
                      مدیریت ساعات کاری
                    </h2>
                    <p style={{
                      margin: '4px 0 0 0',
                      color: "var(--text-secondary)",
                      fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)'
                    }}>
                      روزها را کارت‌محور ببین، شیفت‌ها را با drag & drop بچین و فقط با یک لمس روی چند روز اعمال کن.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (!showWorkingHourForm) {
                      // وقتی دیالوگ باز می‌شه، شیفت‌های روز اول (شنبه) رو load کن
                      const firstDayValue = WEEK_DAY_OPTIONS[0].value;
                      setNewWorkingHour({
                        selectedDays: [firstDayValue],
                        shifts: loadSavedShiftsForDay(workingHours, firstDayValue),
                      });
                    }
                    setShowWorkingHourForm(!showWorkingHourForm);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 28px)',
                    borderRadius: '50px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(79, 172, 254, 0.3)',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Plus size={18} />
                  {showWorkingHourForm ? 'بستن' : 'افزودن زمان‌بندی'}
                </Button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1rem'
              }} className="working-hour-summary-grid">
                <div style={{
                  background: 'var(--card)',
                  borderRadius: '20px',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
                }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: '0.82rem', marginBottom: '0.35rem' }}>روزهای فعال</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: "var(--text-primary)" }}>{activeWorkingDays}</div>
                </div>
                <div style={{
                  background: 'var(--card)',
                  borderRadius: '20px',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
                }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: '0.82rem', marginBottom: '0.35rem' }}>کل شیفت‌ها</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: "var(--text-primary)" }}>{toPersianNumber(workingHours.length)}</div>
                </div>
                <div style={{
                  background: 'var(--card)',
                  borderRadius: '20px',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
                }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: '0.82rem', marginBottom: '0.35rem' }}>روزهای چندشیفته</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: "var(--text-primary)" }}>{toPersianNumber(multiShiftDays)}</div>
                </div>
              </div>

              <AnimatePresence>
                {showWorkingHourForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 1000,
                      background: 'rgba(15, 23, 42, 0.56)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.75rem'
                    }}
                    onClick={() => {
                      setShowWorkingHourForm(false);
                      setDraggedShiftIndex(null);
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 10 }}
                      transition={{ duration: 0.22 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: 'min(1040px, calc(100vw - 0.75rem))',
                        maxHeight: 'calc(100vh - 1.5rem)',
                        overflowY: 'auto',
                        background: 'var(--card)',
                        borderRadius: '28px',
                        boxShadow: '0 24px 90px rgba(15, 23, 42, 0.3)',
                        border: '1px solid var(--border)',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 3,
                        background: 'var(--card)',
                        borderBottom: '1px solid #eef2f7'
                      }}>
                        <div style={{
                          height: '4px',
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          borderTopLeftRadius: '28px',
                          borderTopRightRadius: '28px'
                        }} />
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          padding: 'clamp(1rem, 3vw, 1.5rem)'
                        }}>
                          <div>
                            <h3 style={{
                              color: "var(--text-primary)",
                              fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                              fontWeight: 800,
                              margin: 0
                            }}>
                              تنظیم روز به روز ساعات کاری
                            </h3>
                            <p style={{
                              margin: '0.35rem 0 0 0',
                              color: "var(--text-secondary)",
                              fontSize: '0.92rem',
                              lineHeight: 1.7
                            }}>
                              هر روز را جداگانه تنظیم کن، ذخیره کن و با دکمه روز بعدی برو سراغ روز بعدی. پنج‌شنبه و جمعه هم می‌توانند ساعت متفاوت داشته باشند.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setShowWorkingHourForm(false);
                              setDraggedShiftIndex(null);
                            }}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '12px',
                              border: '1px solid var(--border)',
                              background: 'var(--background-secondary)',
                              color: "var(--text-secondary)",
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            aria-label="بستن دیالوگ"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleAddWorkingHour} style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                          gap: 'clamp(0.75rem, 2vw, 1rem)'
                        }}>
                          <div style={{
                            gridColumn: '1 / -1',
                            background: 'var(--background-secondary)',
                            borderRadius: '22px',
                            border: '1px solid var(--border)',
                            padding: 'clamp(0.9rem, 2.5vw, 1.15rem)'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.75rem',
                              flexWrap: 'wrap',
                              marginBottom: '0.85rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <CalendarDays size={18} color="#0ea5e9" />
                                <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>روز فعلی</span>
                                <span style={{
                                  padding: '0.35rem 0.7rem',
                                  borderRadius: '999px',
                                  background: 'var(--info-surface)',
                                  color: '#0369a1',
                                  fontSize: '0.78rem',
                                  fontWeight: 700
                                }}>
                                  {toPersianNumber(currentWizardDayIndex + 1)} از 7
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const prevDay = WEEK_DAY_OPTIONS[currentWizardDayIndex - 1];
                                    if (!prevDay) return;
                                    setNewWorkingHour((prev) => ({
                                      ...prev,
                                      selectedDays: [prevDay.value],
                                      shifts: loadSavedShiftsForDay(workingHours, prevDay.value),
                                    }));
                                  }}
                                  disabled={currentWizardDayIndex === 0}
                                  style={{
                                    padding: '0.55rem 0.85rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    background: currentWizardDayIndex === 0 ? '#f1f5f9' : '#eff6ff',
                                    color: currentWizardDayIndex === 0 ? '#94a3b8' : '#2563eb',
                                    fontSize: '0.83rem',
                                    fontWeight: 700,
                                    cursor: currentWizardDayIndex === 0 ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  قبلی
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextDay = WEEK_DAY_OPTIONS[currentWizardDayIndex + 1];
                                    if (!nextDay) return;
                                    setNewWorkingHour((prev) => ({
                                      ...prev,
                                      selectedDays: [nextDay.value],
                                      shifts: loadSavedShiftsForDay(workingHours, nextDay.value),
                                    }));
                                  }}
                                  disabled={!nextWizardDay}
                                  style={{
                                    padding: '0.55rem 0.85rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    background: !nextWizardDay ? '#f1f5f9' : '#eff6ff',
                                    color: !nextWizardDay ? '#94a3b8' : '#2563eb',
                                    fontSize: '0.83rem',
                                    fontWeight: 700,
                                    cursor: !nextWizardDay ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  روز بعدی
                                </button>
                              </div>
                            </div>

                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))',
                              gap: '0.5rem',
                              marginBottom: '0.9rem'
                            }}>
                              {WEEK_DAY_OPTIONS.map((day, index) => {
                                const isSelected = String(currentWizardDayValue) === String(day.value);
                                const hasSaved = (workingHoursByDay[index]?.shifts || []).length > 0;
                                return (
                                  <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => {
                                      setNewWorkingHour((prev) => ({
                                        ...prev,
                                        selectedDays: [day.value],
                                        shifts: loadSavedShiftsForDay(workingHours, day.value),
                                      }));
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.25rem',
                                      padding: '0.8rem 0.7rem',
                                      borderRadius: '16px',
                                      border: isSelected ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
                                      background: isSelected ? 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)' : 'white',
                                      color: isSelected ? 'white' : '#475569',
                                      boxShadow: isSelected ? '0 10px 22px rgba(14, 165, 233, 0.18)' : 'none',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      fontWeight: 800
                                    }}
                                  >
                                    <span style={{ fontSize: '0.95rem' }}>{toPersianNumber(index + 1)}</span>
                                    <span style={{ fontSize: '0.82rem' }}>{day.label}</span>
                                    <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                                      {hasSaved ? 'ثبت شده' : 'آزاد'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.75rem',
                              flexWrap: 'wrap'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
                                <div style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '14px',
                                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 900
                                }}>
                                  {toPersianNumber(currentWizardDayIndex + 1)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                    {currentWizardDay.label}
                                  </div>
                                  <div style={{ color: "var(--text-secondary)", fontSize: '0.84rem' }}>
                                    {nextWizardDay ? `بعدی: ${nextWizardDay.label}` : 'آخرین روز هفته'}
                                  </div>
                                </div>
                              </div>
                              <div style={{
                                padding: '0.55rem 0.85rem',
                                borderRadius: '999px',
                                background: '#fff7ed',
                                color: '#c2410c',
                                fontWeight: 800,
                                fontSize: '0.82rem'
                              }}>
                                تنها این روز ذخیره می‌شود
                              </div>
                            </div>
                          </div>

                          <div style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.75rem',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.6rem 0.95rem',
                              borderRadius: '999px',
                              background: 'var(--background-secondary)',
                              color: "var(--text-secondary)",
                              fontSize: '0.88rem',
                              fontWeight: 700
                            }}>
                              <Sparkles size={16} />
                              preset آماده برای همین روز
                            </div>

                            <button
                              type="button"
                              onClick={() => setNewWorkingHour((prev) => ({
                                ...prev,
                                shifts: [createShift()],
                              }))}
                              style={{
                                border: 'none',
                                background: 'var(--background-secondary)',
                                color: "var(--text-secondary)",
                                borderRadius: '999px',
                                padding: '0.55rem 0.9rem',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <RotateCcw size={14} style={{ marginLeft: '0.35rem', verticalAlign: '-2px' }} />
                              بازنشانی شیفت‌های روز
                            </button>
                          </div>

                          <div style={{
                            gridColumn: '1 / -1',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                            gap: '0.75rem'
                          }} className="working-hour-preset-grid">
                            {WORKING_HOUR_PRESETS.map((preset) => (
                              <button
                                key={preset.key}
                                type="button"
                                onClick={() => handleApplyWorkingHourPreset(preset)}
                                style={{
                                  border: '1px solid #dbeafe',
                                  background: 'var(--card)',
                                  borderRadius: '18px',
                                  padding: '0.9rem 1rem',
                                  cursor: 'pointer',
                                  textAlign: 'right',
                                  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)'
                                }}
                              >
                                <div style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{preset.icon}</div>
                                <div style={{ fontWeight: 800, color: "var(--text-primary)", marginBottom: '0.25rem' }}>{preset.label}</div>
                                <div style={{ color: "var(--text-secondary)", fontSize: '0.82rem' }}>
                                  {(preset.shifts || []).map((shift) => formatWorkingRange(shift.start_time, shift.end_time)).join(' • ')}
                                </div>
                              </button>
                            ))}
                          </div>

                          <div style={{
                            gridColumn: '1 / -1',
                            display: 'grid',
                            gap: '0.85rem'
                          }}>
                            {(currentWizardShifts || []).map((shift, index) => (
                              <div
                                key={shift.id || `${shift.start_time}-${shift.end_time}-${index}`}
                                draggable
                                onDragStart={(event) => handleShiftDragStart(event, index)}
                                onDragOver={handleShiftDragOver}
                                onDrop={() => handleShiftDrop(index)}
                                onDragEnd={handleShiftDragEnd}
                                style={{
                                  background: draggedShiftIndex === index ? '#eff6ff' : 'white',
                                  border: draggedShiftIndex === index ? '1px solid #60a5fa' : '1px solid #e2e8f0',
                                  borderRadius: '20px',
                                  padding: 'clamp(0.85rem, 2.5vw, 1rem)',
                                  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)'
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.75rem',
                                  marginBottom: '0.8rem',
                                  flexWrap: 'wrap'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '10px',
                                      background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                                      color: 'white',
                                      fontWeight: 800,
                                      fontSize: '0.8rem'
                                    }}>
                                      {index + 1}
                                    </span>
                                    <strong style={{ color: "var(--text-primary)", fontSize: '0.95rem' }}>
                                      شیفت {toPersianNumber(index + 1)}
                                    </strong>
                                  </div>

                                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const duplicate = createShift(shift.start_time, shift.end_time);
                                        setNewWorkingHour((prev) => ({
                                          ...prev,
                                          shifts: [
                                            ...prev.shifts.slice(0, index + 1),
                                            duplicate,
                                            ...prev.shifts.slice(index + 1),
                                          ],
                                        }));
                                      }}
                                      style={{
                                        border: 'none',
                                        background: 'var(--info-surface)',
                                        color: '#2563eb',
                                        borderRadius: '999px',
                                        padding: '0.45rem 0.75rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <Copy size={14} style={{ marginLeft: '0.35rem', verticalAlign: '-2px' }} />
                                      کپی
                                    </button>
                                    {currentWizardShifts.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewWorkingHour((prev) => ({
                                            ...prev,
                                            shifts: prev.shifts.filter((_, shiftIndex) => shiftIndex !== index)
                                          }));
                                        }}
                                        style={{
                                          border: 'none',
                                          background: 'var(--danger-surface)',
                                          color: '#b91c1c',
                                          borderRadius: '999px',
                                          padding: '0.45rem 0.75rem',
                                          fontSize: '0.8rem',
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        حذف
                                      </button>
                                    )}
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      padding: '0.45rem 0.75rem',
                                      borderRadius: '999px',
                                      background: 'var(--background-secondary)',
                                      color: "var(--text-secondary)",
                                      fontSize: '0.8rem',
                                      fontWeight: 700
                                    }}>
                                      <GripVertical size={14} />
                                      جابه‌جایی
                                    </span>
                                  </div>
                                </div>

                                <div
                                  className="working-hour-shift-grid"
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                    gap: '0.85rem',
                                    alignItems: 'end'
                                  }}
                                >
                                  <div style={{ minWidth: 0 }}>
                                    <label style={{
                                      display: 'block',
                                      marginBottom: '0.55rem',
                                      fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
                                      color: "var(--text-secondary)",
                                      fontWeight: 700
                                    }}>
                                      ساعت شروع
                                    </label>
                                    <select
                                      value={shift.start_time}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setNewWorkingHour((prev) => ({
                                          ...prev,
                                          shifts: prev.shifts.map((item, shiftIndex) => (
                                            shiftIndex === index
                                              ? { ...item, start_time: value }
                                              : item
                                          )),
                                        }));
                                      }}
                                      style={{
                                        width: '100%',
                                        maxWidth: '100%',
                                        minWidth: 0,
                                        boxSizing: 'border-box',
                                        padding: 'clamp(10px, 1.5vw, 12px) clamp(10px, 2vw, 16px)',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '14px',
                                        fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
                                        color: "var(--text-primary)",
                                        backgroundColor: 'var(--card)',
                                        outline: 'none'
                                      }}
                                    >
                                      {TIME_OPTIONS.map((time) => (
                                        <option key={time} value={time}>
                                          {time}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div style={{ minWidth: 0 }}>
                                    <label style={{
                                      display: 'block',
                                      marginBottom: '0.55rem',
                                      fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
                                      color: "var(--text-secondary)",
                                      fontWeight: 700
                                    }}>
                                      ساعت پایان
                                    </label>
                                    <select
                                      value={shift.end_time}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setNewWorkingHour((prev) => ({
                                          ...prev,
                                          shifts: prev.shifts.map((item, shiftIndex) => (
                                            shiftIndex === index
                                              ? { ...item, end_time: value }
                                              : item
                                          )),
                                        }));
                                      }}
                                      style={{
                                        width: '100%',
                                        maxWidth: '100%',
                                        minWidth: 0,
                                        boxSizing: 'border-box',
                                        padding: 'clamp(10px, 1.5vw, 12px) clamp(10px, 2vw, 16px)',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '14px',
                                        fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
                                        color: "var(--text-primary)",
                                        backgroundColor: 'var(--card)',
                                        outline: 'none'
                                      }}
                                    >
                                      {TIME_OPTIONS.map((time) => (
                                        <option key={time} value={time}>
                                          {time}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div style={{
                                    minWidth: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    {currentWizardShifts.length < 2 ? (
                                      <button
                                        type="button"
                                        onClick={handleAddWorkingHourShift}
                                        style={{
                                          width: '100%',
                                          padding: '0.85rem 0.9rem',
                                          borderRadius: '14px',
                                          border: '1px dashed #93c5fd',
                                          background: 'var(--info-surface)',
                                          color: '#2563eb',
                                          fontSize: '0.85rem',
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        + افزودن شیفت دوم
                                      </button>
                                    ) : (
                                      <div style={{
                                        width: '100%',
                                        padding: '0.85rem 0.9rem',
                                        borderRadius: '14px',
                                        border: '1px solid #fde68a',
                                        background: 'var(--warning-surface)',
                                        color: '#92400e',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        textAlign: 'center'
                                      }}>
                                        حداکثر ۲ شیفت در هر روز
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.75rem',
                          flexWrap: 'wrap',
                          marginTop: '1.15rem'
                        }}>
                          <p style={{
                            margin: 0,
                            color: "var(--text-secondary)",
                            fontSize: '0.85rem',
                            lineHeight: 1.7
                          }}>
                            هر بار فقط همان روزی که بالای فرم انتخاب شده ذخیره می‌شود. بعد از ذخیره، به روز بعدی می‌رویم.
                          </p>

                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                          }}>
                            <button
                              type="button"
                              onClick={() => setNewWorkingHour((prev) => ({
                                ...prev,
                                shifts: [createShift()]
                              }))}
                              style={{
                                border: 'none',
                                background: 'var(--background-secondary)',
                                color: "var(--text-secondary)",
                                borderRadius: '999px',
                                padding: '0.55rem 0.9rem',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              بازنشانی روز فعلی
                            </button>
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '0.75rem',
                          justifyContent: 'flex-end',
                          flexWrap: 'wrap',
                          marginTop: '1.25rem'
                        }} className="working-hour-actions admin-button-group">
                          <Button
                            type="submit"
                            disabled={loading}
                            style={{
                              padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 32px)',
                              borderRadius: '50px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
                              fontWeight: 600,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.6 : 1,
                              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {loading ? 'در حال ذخیره...' : (nextWizardDay ? `ثبت این روز و رفتن به ${nextWizardDay.label}` : 'ثبت و پایان')}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setShowWorkingHourForm(false);
                              setNewWorkingHour(createWorkingHourFormState());
                              setDraggedShiftIndex(null);
                            }}
                            style={{
                              padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 32px)',
                              borderRadius: '50px',
                              border: '2px solid #e2e8f0',
                              background: 'var(--card)',
                              color: "var(--text-secondary)",
                              fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--background-secondary)';
                              e.currentTarget.style.borderColor = '#94a3b8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--card)';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            انصراف
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginTop: '1rem'
              }} className="working-hour-day-grid">
                {workingHoursByDay.map((day) => (
                  <WorkingHoursDayCard
                    key={day.value}
                    day={day}
                    onDelete={handleDeleteWorkingHour}
                  />
                ))}
              </div>
            </div>
          )}

          {/* تب رزروها */}
          {activeTab === 'bookings' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)'
              }}>
                <div style={{
                  width: 'clamp(36px, 6vw, 48px)',
                  height: 'clamp(36px, 6vw, 48px)',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 6px 16px rgba(240, 147, 251, 0.3)',
                  flexShrink: 0
                }}>
                  <Calendar size={20} />
                </div>
                <h2 style={{
                  color: "var(--text-primary)",
                  fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                  fontWeight: 700,
                  margin: 0
                }}>
                  مدیریت رزروها
                </h2>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  background: 'var(--card)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  border: "1px solid var(--border)",
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                }} />

                {bookings.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 'clamp(2rem, 4vw, 4rem) clamp(1rem, 2vw, 2rem)',
                    color: "var(--text-secondary)"
                  }}>
                    <Calendar size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p style={{
                      fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: '0.5rem'
                    }}>
                      هنوز رزروی ثبت نشده است
                    </p>
                    <p style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)' }}>
                      مشتریان هنوز نوبت‌گیری نکرده‌اند
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }} className="admin-table">
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      minWidth: 'auto',
                      fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)'
                    }}>
                      <thead>
                        <tr style={{
                          background: 'var(--background-secondary)',
                          borderBottom: '1px solid #e2e8f0'
                        }}>
                          <TableHeader>مشتری</TableHeader>
                          <TableHeader>خدمت</TableHeader>
                          <TableHeader>تاریخ و ساعت</TableHeader>
                          <TableHeader>وضعیت</TableHeader>
                          <TableHeader>اطلاعات تماس</TableHeader>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(booking => (
                          <BookingRow key={booking.id} booking={booking} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* تب نظرات مشتریان */}
          {activeTab === 'reviews' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)'
              }}>
                <div style={{
                  width: 'clamp(36px, 6vw, 48px)',
                  height: 'clamp(36px, 6vw, 48px)',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 6px 16px rgba(251, 191, 36, 0.3)',
                  flexShrink: 0
                }}>
                  <Star size={20} />
                </div>
                <h2 style={{
                  color: "var(--text-primary)",
                  fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                  fontWeight: 700,
                  margin: 0
                }}>
                  نظرات مشتریان
                </h2>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  background: 'var(--card)',
                  borderRadius: '24px',
                  padding: 'clamp(1rem, 3vw, 2rem)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  border: "1px solid var(--border)",
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                }} />

                <ManageReviews salonId={salon?.id} />
              </motion.div>
            </div>
          )}

          {/* تب نمونه کارها */}
          {activeTab === 'portfolio' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)'
              }}>
                <div style={{
                  width: 'clamp(36px, 6vw, 48px)',
                  height: 'clamp(36px, 6vw, 48px)',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 6px 16px rgba(236, 72, 153, 0.3)',
                  flexShrink: 0
                }}>
                  <Sparkles size={20} />
                </div>
                <h2 style={{
                  color: "var(--text-primary)",
                  fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                  fontWeight: 700,
                  margin: 0
                }}>
                  نمونه کارها
                </h2>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <PortfolioManager salonId={salon?.id} />
              </motion.div>
            </div>
          )}

          {/* تب مشخصات مالک */}
          {activeTab === 'owner-info' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)'
              }}>
                <div style={{
                  width: 'clamp(36px, 6vw, 48px)',
                  height: 'clamp(36px, 6vw, 48px)',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 6px 16px rgba(139, 92, 246, 0.3)',
                  flexShrink: 0
                }}>
                  <Users size={20} />
                </div>
                <h2 style={{
                  color: "var(--text-primary)",
                  fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                  fontWeight: 700,
                  margin: 0
                }}>
                  مشخصات مالک
                </h2>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  background: 'var(--card)',
                  borderRadius: '16px',
                  padding: 'clamp(1.5rem, 3vw, 2rem)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  border: '1px solid var(--border)'
                }}
              >
                <form onSubmit={handleSaveOwnerInfo}>
                  {/* عکس مالک */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.75rem',
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontSize: '0.95rem'
                    }}>
                      عکس مالک (دایره‌ای)
                    </label>

                    <div style={{
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap'
                    }}>
                      {/* پیش‌نمایش دایره‌ای نهایی */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          border: '3px solid var(--border)',
                          overflow: 'hidden',
                          backgroundColor: 'var(--background-secondary)',
                          boxShadow: '0 4px 16px rgba(139,92,246,0.15)'
                        }}>
                          {ownerImagePreview ? (
                            <img
                              src={ownerImagePreview}
                              alt="Owner preview"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: `${imagePosition.x}% ${imagePosition.y}%`
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <Users size={40} color="#cbd5e1" />
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: "var(--text-secondary)", textAlign: 'center' }}>
                          پیش‌نمایش نهایی
                        </span>

                        {ownerImagePreview && (
                          <button
                            type="button"
                            onClick={() => setShowPositionEditor(true)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '5px',
                              padding: '6px 14px', borderRadius: '20px',
                              border: '1.5px solid var(--primary)', background: 'var(--surface)',
                              color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--primary)'; }}
                          >
                            <Edit2 size={13} />
                            تنظیم موقعیت
                          </button>
                        )}
                      </div>

                      {/* Position Editor (inline) */}
                      {showPositionEditor && ownerImagePreview ? (
                        <div style={{
                          flex: 1, minWidth: '260px',
                          background: 'var(--background-secondary)', borderRadius: '16px',
                          border: '1.5px solid #e0e7ff', padding: '1.25rem',
                          display: 'flex', flexDirection: 'column', gap: '1rem'
                        }}>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Edit2 size={15} color="#8b5cf6" />
                            موقعیت عکس را تنظیم کنید
                          </div>
                          <div style={{ fontSize: '0.8rem', color: "var(--text-secondary)" }}>
                            عکس را در کادر زیر بکشید تا بهترین قاب دایره‌ای رو انتخاب کنید
                          </div>

                          {/* Drag Area */}
                          <div
                            style={{
                              width: '100%', maxWidth: '260px', aspectRatio: '1/1',
                              margin: '0 auto',
                              borderRadius: '50%', overflow: 'hidden',
                              cursor: isDragging ? 'grabbing' : 'grab',
                              position: 'relative',
                              border: '3px solid #c4b5fd',
                              userSelect: 'none',
                              touchAction: 'none',
                            }}
                            onMouseDown={handleEditorMouseDown}
                            onMouseMove={handleEditorMouseMove}
                            onMouseUp={handleEditorMouseUp}
                            onMouseLeave={handleEditorMouseUp}
                            onTouchStart={handleEditorMouseDown}
                            onTouchMove={handleEditorMouseMove}
                            onTouchEnd={handleEditorMouseUp}
                          >
                            <img
                              src={ownerImagePreview}
                              alt="Position editor"
                              draggable={false}
                              style={{
                                width: '100%', height: '100%',
                                objectFit: 'cover',
                                objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                                pointerEvents: 'none',
                              }}
                            />

                          </div>

                          {/* Sliders for fine-tuning */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div>
                              <label style={{ fontSize: '0.78rem', color: "var(--text-secondary)", fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                                <span>عمودی (بالا/پایین)</span>
                                <span style={{ color: '#8b5cf6' }}>{Math.round(imagePosition.y)}%</span>
                              </label>
                              <input
                                type="range" min="0" max="100" step="1"
                                value={imagePosition.y}
                                onChange={e => setImagePosition(p => ({ ...p, y: Number(e.target.value) }))}
                                style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => setImagePosition({ x: 50, y: 50 })}
                              style={{
                                flex: 1, padding: '7px', borderRadius: '8px',
                                border: '1px solid var(--border)', background: 'var(--card)',
                                color: "var(--text-secondary)", fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              بازنشانی مرکز
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowPositionEditor(false)}
                              style={{
                                flex: 1, padding: '7px', borderRadius: '8px',
                                border: 'none', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              تأیید موقعیت ✓
                            </button>
                          </div>
                        </div>
                        ) : (
                        /* آپلود عکس */
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <label
                            htmlFor="owner-image-input"
                            style={{
                              display: 'block',
                              padding: '1.5rem',
                              border: '2px dashed var(--border)',
                              borderRadius: '12px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              backgroundColor: 'var(--surface)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--primary)';
                              e.currentTarget.style.backgroundColor = 'var(--card-hover)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.backgroundColor = 'var(--surface)';
                            }}
                          >
                            <div style={{ marginBottom: '0.5rem' }}>
                              <Plus size={24} color="#8b5cf6" style={{ margin: '0 auto' }} />
                            </div>
                            <div style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: '0.25rem'
                            }}>
                              {ownerImagePreview ? 'تغییر عکس' : 'عکس را انتخاب کنید'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: "var(--text-secondary)" }}>
                              JPEG, PNG, WebP یا GIF (حداکثر 5 مگابایت)
                            </div>
                          </label>
                          <input
                            id="owner-image-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleOwnerImageSelect}
                            style={{ display: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* توضیح مالک */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.75rem',
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontSize: '0.95rem'
                    }}>
                      توضیح درباره خود (حداکثر ۵۰۰ کاراکتر)
                    </label>
                    <textarea
                      value={ownerDescription}
                      onChange={(e) => setOwnerDescription(e.target.value)}
                      placeholder="درباره خود و تخصص‌های خود را بنویسید..."
                      maxLength={500}
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontFamily: 'inherit',
                        fontSize: '0.95rem',
                        color: "var(--text-primary)",
                        lineHeight: 1.5,
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{
                      fontSize: '0.85rem',
                      color: "var(--text-secondary)",
                      marginTop: '0.5rem'
                    }}>
                      {ownerDescription.length} / ۵۰۰ کاراکتر
                    </div>
                  </div>

                  {/* دکمه ذخیره */}
                  <button
                    type="submit"
                    disabled={savingOwnerInfo}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.5rem',
                      background: savingOwnerInfo
                        ? '#cbd5e1'
                        : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: savingOwnerInfo ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {savingOwnerInfo ? 'در حال ذخیره‌سازی...' : 'ذخیره مشخصات'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {/* تب QR کد سالن */}
          {activeTab === 'qr-code' && (
            <div>
              <style>{`
                .qr-layout {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 2.5rem;
                  align-items: start;
                }
                .qr-image-box {
                  width: 220px;
                  height: 220px;
                }
                .qr-action-buttons {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 0.75rem;
                }
                @media (max-width: 768px) {
                  .qr-layout {
                    grid-template-columns: 1fr !important;
                    gap: 1.5rem !important;
                  }
                  .qr-image-box {
                    width: 180px !important;
                    height: 180px !important;
                  }
                  .qr-action-buttons {
                    grid-template-columns: 1fr 1fr !important;
                  }
                }
                @media (max-width: 400px) {
                  .qr-image-box {
                    width: 150px !important;
                    height: 150px !important;
                  }
                  .qr-action-buttons {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  background: 'var(--card)',
                  borderRadius: '24px',
                  padding: 'clamp(1rem, 3vw, 2rem)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  border: "1px solid var(--border)"
                }}
              >
                {/* هدر */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '1.75rem'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    flexShrink: 0,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)'
                  }}>
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h2 style={{
                      color: "var(--text-primary)",
                      fontSize: 'clamp(1rem, 3vw, 1.6rem)',
                      fontWeight: 700,
                      margin: 0
                    }}>
                      QR کد منحصربه‌فرد سالن
                    </h2>
                    <p style={{
                      color: "var(--text-secondary)",
                      fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
                      margin: '4px 0 0 0'
                    }}>
                      مشتریان با اسکن این QR کد می‌توانند رزرو نوبت کنند
                    </p>
                  </div>
                </div>

                {/* پیام برای کارمند */}
                {user?.role !== 'owner' ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 2rem',
                    gap: '1rem',
                    color: "var(--text-secondary)",
                    textAlign: 'center'
                  }}>
                    <QrCode size={64} style={{ opacity: 0.3 }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                      QR Code فقط برای مالک سالن قابل مشاهده است
                    </p>
                  </div>
                ) : (
                  <div className="qr-layout">

                    {/* ستون چپ: تصویر QR */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      {/* باکس QR */}
                      {qrLoading ? (
                        <div className="qr-image-box" style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--background-secondary)',
                          borderRadius: '16px',
                          border: '2px solid #e2e8f0'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            border: '3px solid #e2e8f0',
                            borderTop: '3px solid #667eea',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                        </div>
                      ) : qrError ? (
                        <div className="qr-image-box" style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem',
                          background: 'var(--danger-surface)',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          textAlign: 'center'
                        }}>
                          <span style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: 600 }}>
                            {qrError}
                          </span>
                          <button
                            onClick={() => {
                              setQrError(null);
                              setQrLoading(true);
                              api.getQRCode()
                                .then(async (res) => {
                                  const { qr_code, qr_url } = res.data;
                                  setQrCode(qr_code);
                                  setQrUrl(qr_url);
                                  const dataUrl = await new Promise((resolve, reject) => {
                                    QRCode.toDataURL(qr_url.trim(), { errorCorrectionLevel: 'H', type: 'image/png', width: 250, margin: 2 }, (err, url) => {
                                      if (err) reject(err); else resolve(url);
                                    });
                                  });
                                  setQrDataUrl(dataUrl);
                                })
                                .catch((err) => setQrError(err.message || 'خطا در دریافت QR Code'))
                                .finally(() => setQrLoading(false));
                            }}
                            style={{
                              padding: '7px 14px',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.82rem'
                            }}
                          >
                            تلاش مجدد
                          </button>
                        </div>
                      ) : qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR Code"
                          className="qr-image-box"
                          style={{
                            border: '3px solid #667eea',
                            borderRadius: '16px',
                            padding: '12px',
                            background: 'var(--card)',
                            boxShadow: '0 6px 24px rgba(102, 126, 234, 0.2)',
                            display: 'block'
                          }}
                        />
                      ) : null}

                      <p style={{
                        fontSize: '0.85rem',
                        color: "var(--text-secondary)",
                        margin: 0,
                        textAlign: 'center'
                      }}>
                        {salon?.name}
                      </p>

                      {/* دکمه‌های عمل */}
                      <div className="qr-action-buttons" style={{ width: '100%' }}>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            if (!qrDataUrl) return;
                            const link = document.createElement('a');
                            link.href = qrDataUrl;
                            link.download = `${salon?.name || 'salon'}-qr-code.png`;
                            link.click();
                          }}
                          style={{
                            padding: 'clamp(9px, 2vw, 12px) clamp(10px, 2vw, 16px)',
                            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: !qrDataUrl ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(72,187,120,0.3)',
                            opacity: !qrDataUrl ? 0.6 : 1,
                            pointerEvents: !qrDataUrl ? 'none' : 'auto',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Download size={16} />
                          دانلود
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            if (!qrDataUrl) return;
                            const printWindow = window.open('', '', 'height=500,width=500');
                            printWindow.document.write(`
                              <html>
                                <head><title>چاپ QR Code</title></head>
                                <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;">
                                  <div>
                                    <h2 style="margin-bottom:16px">${salon?.name}</h2>
                                    <img src="${qrDataUrl}" style="width:280px;height:280px;border:2px solid #667eea;padding:10px;" />
                                    <p style="margin-top:16px;color:#555">برای رزرو نوبت اسکن کنید</p>
                                  </div>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                          }}
                          style={{
                            padding: 'clamp(9px, 2vw, 12px) clamp(10px, 2vw, 16px)',
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: !qrDataUrl ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
                            opacity: !qrDataUrl ? 0.6 : 1,
                            pointerEvents: !qrDataUrl ? 'none' : 'auto',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Printer size={16} />
                          چاپ
                        </motion.button>
                      </div>
                    </div>

                    {/* ستون راست: اطلاعات */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      {/* شناسه QR */}
                      <div style={{
                        background: 'var(--background-secondary)',
                        padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)'
                      }}>
                        <p style={{ fontSize: '0.8rem', color: "var(--text-secondary)", margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                          شناسه QR Code:
                        </p>
                        <div style={{
                          background: 'var(--card)',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          fontSize: 'clamp(0.7rem, 1.5vw, 0.82rem)',
                          fontFamily: 'monospace',
                          color: "var(--text-primary)",
                          wordBreak: 'break-all',
                          lineHeight: '1.6'
                        }}>
                          {qrCode || 'درحال بارگذاری...'}
                        </div>
                      </div>

                      {/* لینک QR */}
                      <div style={{
                        background: 'var(--info-surface)',
                        padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                        borderRadius: '12px',
                        border: '1px solid #bfdbfe',
                        borderRight: '4px solid #667eea'
                      }}>
                        <p style={{ fontSize: '0.8rem', color: '#1e40af', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                          لینک QR Code:
                        </p>
                        <div style={{
                          background: 'var(--card)',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe',
                          fontSize: 'clamp(0.7rem, 1.5vw, 0.82rem)',
                          fontFamily: 'monospace',
                          color: "var(--text-primary)",
                          wordBreak: 'break-all',
                          lineHeight: '1.6'
                        }}>
                          {qrUrl || 'درحال بارگذاری...'}
                        </div>
                      </div>

                      {/* راهنمای استفاده */}
                      <div style={{
                        background: 'var(--success-surface)',
                        padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                        borderRadius: '12px',
                        border: '1px solid #dcfce7',
                        borderRight: '4px solid #10b981'
                      }}>
                        <h3 style={{ color: '#10b981', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
                          🎯 نحوه استفاده:
                        </h3>
                        <ol style={{
                          margin: 0,
                          paddingRight: '1.2rem',
                          color: '#15803d',
                          lineHeight: '1.9',
                          fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
                        }}>
                          <li>تصویر QR کد را دانلود کنید</li>
                          <li>آن را چاپ کرده و در مغازه قرار دهید</li>
                          <li>مشتریان با دوربین گوشی اسکن می‌کنند</li>
                          <li>صفحه سالن شما باز می‌شود</li>
                          <li>مشتری نوبت رزرو می‌کند</li>
                        </ol>
                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* تب تنظیمات سالن */}
          {activeTab === 'settings' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)'
              }}>
                <div style={{
                  width: 'clamp(36px, 6vw, 48px)',
                  height: 'clamp(36px, 6vw, 48px)',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 6px 16px rgba(79, 172, 254, 0.3)',
                  flexShrink: 0
                }}>
                  <Building2 size={20} />
                </div>
                <h2 style={{
                  color: "var(--text-primary)",
                  fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                  fontWeight: 700,
                  margin: 0
                }}>
                  تنظیمات سالن
                </h2>
              </div>

              {/* بخش ویرایش اطلاعات سالن */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                style={{
                  background: 'var(--card)',
                  borderRadius: '24px',
                  padding: 'clamp(1rem, 3vw, 2rem)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  border: "1px solid var(--border)",
                  position: 'relative',
                  marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
                }} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <h3 style={{
                    color: "var(--text-primary)",
                    fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                    fontWeight: 600,
                    margin: 0
                  }}>
                    اطلاعات سالن
                  </h3>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 'clamp(0.75rem, 2vw, 1rem)'
                }} className="admin-info-grid">
                  <div style={{
                    padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                    background: 'var(--background-secondary)',
                    borderRadius: '12px',
                    borderRight: '3px solid #667eea'
                  }}>
                    <p style={{
                      fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                      color: "var(--text-secondary)",
                      margin: '0 0 0.5rem 0',
                      fontWeight: 600
                    }}>
                      نام سالن
                    </p>
                    <p style={{
                      fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                      color: "var(--text-primary)",
                      margin: 0,
                      fontWeight: 600
                    }}>
                      {salon?.name || '—'}
                    </p>
                  </div>

                  <div style={{
                    padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                    background: 'var(--background-secondary)',
                    borderRadius: '12px',
                    borderRight: '3px solid #f093fb'
                  }}>
                    <p style={{
                      fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                      color: "var(--text-secondary)",
                      margin: '0 0 0.5rem 0',
                      fontWeight: 600
                    }}>
                      شهر
                    </p>
                    <p style={{
                      fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                      color: "var(--text-primary)",
                      margin: 0,
                      fontWeight: 600
                    }}>
                      {salon?.city || '—'}
                    </p>
                  </div>

                  <div style={{
                    padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                    background: 'var(--background-secondary)',
                    borderRadius: '12px',
                    borderRight: '3px solid #4facfe'
                  }}>
                    <p style={{
                      fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                      color: "var(--text-secondary)",
                      margin: '0 0 0.5rem 0',
                      fontWeight: 600
                    }}>
                      تلفن
                    </p>
                    <p style={{
                      fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                      color: "var(--text-primary)",
                      margin: 0,
                      fontWeight: 600
                    }}>
                      {salon?.phone || '—'}
                    </p>
                  </div>

                  <div style={{
                    padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                    background: 'var(--background-secondary)',
                    borderRadius: '12px',
                    borderRight: '3px solid #10b981',
                    gridColumn: 'span 1'
                  }}>
                    <p style={{
                      fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                      color: "var(--text-secondary)",
                      margin: '0 0 0.5rem 0',
                      fontWeight: 600
                    }}>
                      آدرس
                    </p>
                    <p style={{
                      fontSize: 'clamp(0.8rem, 1.3vw, 0.95rem)',
                      color: "var(--text-primary)",
                      margin: 0,
                      fontWeight: 600,
                      lineHeight: '1.4',
                      wordBreak: 'break-word'
                    }}>
                      {salon?.address || '—'}
                    </p>
                  </div>

                  <div style={{
                    padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                    background: 'var(--background-secondary)',
                    borderRadius: '12px',
                    borderRight: '3px solid #34d399'
                  }}>
                    <p style={{
                      fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                      color: "var(--text-secondary)",
                      margin: '0 0 0.5rem 0',
                      fontWeight: 600
                    }}>
                      موبایل
                    </p>
                    <p style={{
                      fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                      color: "var(--text-primary)",
                      margin: 0,
                      fontWeight: 600
                    }}>
                      {salon?.mobile || '—'}
                    </p>
                  </div>
                </div>

                {/* دکمه ویرایش شماره‌های تماس - فقط مالک سالن */}
                <div style={{ marginTop: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
                  {!showContactEditForm ? (
                    <button
                      type="button"
                      onClick={() => {
                        setContactForm({
                          phone: salon?.phone || '',
                          mobile: salon?.mobile || '',
                        });
                        setContactInfoError('');
                        setShowContactEditForm(true);
                      }}
                      style={{
                        padding: '0.6rem 1.25rem',
                        background: 'var(--card)',
                        color: '#4facfe',
                        border: '1.5px solid #4facfe',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      ویرایش شماره تلفن و موبایل
                    </button>
                  ) : (
                    <form
                      onSubmit={handleSaveContactInfo}
                      style={{
                        padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                        background: 'var(--background-secondary)',
                        borderRadius: '14px',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 'clamp(0.75rem, 2vw, 1rem)'
                      }}>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            fontSize: '0.85rem'
                          }}>
                            تلفن ثابت (اختیاری)
                          </label>
                          <input
                            type="text"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                            placeholder="مثلاً 02112345678"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              fontFamily: 'inherit',
                              fontSize: '0.95rem',
                              color: "var(--text-primary)",
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            fontSize: '0.85rem'
                          }}>
                            موبایل (الزامی)
                          </label>
                          <input
                            type="text"
                            value={contactForm.mobile}
                            onChange={(e) => setContactForm((f) => ({ ...f, mobile: e.target.value }))}
                            placeholder="مثلاً 09123456789"
                            required
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: contactInfoError ? '1px solid #ef4444' : '1px solid #e2e8f0',
                              fontFamily: 'inherit',
                              fontSize: '0.95rem',
                              color: "var(--text-primary)",
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'clamp(0.75rem, 1.5vw, 1rem)' }}>
                        <button
                          type="submit"
                          disabled={savingContactInfo}
                          style={{
                            padding: '0.7rem 1.5rem',
                            background: savingContactInfo
                              ? '#cbd5e1'
                              : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: savingContactInfo ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          {savingContactInfo ? 'در حال ذخیره‌سازی...' : 'ذخیره'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowContactEditForm(false);
                            setContactInfoError('');
                          }}
                          disabled={savingContactInfo}
                          style={{
                            padding: '0.7rem 1.5rem',
                            background: 'var(--card)',
                            color: "var(--text-secondary)",
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: savingContactInfo ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          انصراف
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>

              {/* وضعیت فعال/غیرفعال */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  background: 'var(--card)',
                  borderRadius: '24px',
                  padding: 'clamp(1rem, 3vw, 2rem)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  border: "1px solid var(--border)",
                  position: 'relative',
                  marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                }} />

                <div style={{ marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)' }}>
                  <h3 style={{
                    color: "var(--text-primary)",
                    fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                    fontWeight: 600,
                    marginBottom: 'clamp(0.75rem, 1.5vw, 1rem)'
                  }}>
                    وضعیت سالن
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: 'clamp(0.75rem, 2vw, 1.5rem)',
                    background: salon?.is_currently_disabled ? '#fee2e2' : '#d1fae5',
                    borderRadius: '16px',
                    border: `2px solid ${salon?.is_currently_disabled ? '#fecaca' : '#a7f3d0'}`,
                    marginBottom: 'clamp(0.75rem, 1.5vw, 1.5rem)',
                    flexWrap: 'wrap'
                  }}>
                    {salon?.is_currently_disabled ? (
                      <>
                        <XCircle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
                        <div>
                          <p style={{
                            margin: 0,
                            fontWeight: 600,
                            color: '#991b1b',
                            fontSize: 'clamp(0.85rem, 1.5vw, 1rem)'
                          }}>
                            سالن در حاضر غیرفعال است
                          </p>
                          {salon?.disabled_until && (
                            <p style={{
                              margin: '4px 0 0 0',
                              color: '#7f1d1d',
                              fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)'
                            }}>
                              تا {new Date(salon.disabled_until).toLocaleDateString('fa-IR')}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={24} color="#059669" style={{ flexShrink: 0 }} />
                        <div>
                          <p style={{
                            margin: 0,
                            fontWeight: 600,
                            color: '#065f46',
                            fontSize: 'clamp(0.85rem, 1.5vw, 1rem)'
                          }}>
                            سالن فعال است
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(0.5rem, 1.5vw, 1rem)' }} className="admin-status-grid">
                    {salon?.is_currently_disabled ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleToggleSalonStatus}
                        disabled={toggleSalonLoading}
                        style={{
                          padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 24px)',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
                          fontWeight: 600,
                          cursor: toggleSalonLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.3s',
                          opacity: toggleSalonLoading ? 0.7 : 1
                        }}
                      >
                        <Power size={18} />
                        فعال کردن سالن
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDisableSalonForm(!showDisableSalonForm)}
                        disabled={toggleSalonLoading}
                        style={{
                          padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 24px)',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                          color: 'white',
                          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
                          fontWeight: 600,
                          cursor: toggleSalonLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.3s',
                          opacity: toggleSalonLoading ? 0.7 : 1
                        }}
                      >
                        <Power size={18} />
                        غیرفعال کردن سالن
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* فرم غیرفعال کردن سالن */}
              {showDisableSalonForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: 'var(--card)',
                    borderRadius: '24px',
                    padding: 'clamp(1rem, 3vw, 2rem)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    border: "1px solid var(--border)",
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                  }} />

                  <h3 style={{
                    color: "var(--text-primary)",
                    fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                    fontWeight: 600,
                    marginBottom: 'clamp(0.75rem, 1.5vw, 1.5rem)'
                  }}>
                    غیرفعال کردن سالن
                  </h3>

                  <form onSubmit={handleDisableSalon}>
                    <div style={{ marginBottom: 'clamp(0.75rem, 1.5vw, 1rem)' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)'
                      }}>
                        مدت زمان غیرفعال بودن (روز) - اختیاری
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="مثال: 7 (برای یک هفته)"
                        value={disableSalonForm.days}
                        onChange={(e) => setDisableSalonForm({ ...disableSalonForm, days: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
                          fontFamily: 'inherit',
                          direction: 'rtl',
                          textAlign: 'right',
                          boxSizing: 'border-box',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      />
                      <p style={{
                        fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                        color: "var(--text-secondary)",
                        marginTop: '0.5rem'
                      }}>
                        اگر خالی بگذارید، سالن تا زمانی که خودتان فعال نکنید غیرفعال می‌ماند
                      </p>
                    </div>

                    <div style={{ marginBottom: 'clamp(0.75rem, 1.5vw, 1.5rem)' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)'
                      }}>
                        دلیل غیرفعال کردن - اختیاری
                      </label>
                      <textarea
                        placeholder="مثال: تعطیلات، نوسازی..."
                        value={disableSalonForm.reason}
                        onChange={(e) => setDisableSalonForm({ ...disableSalonForm, reason: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
                          fontFamily: 'inherit',
                          direction: 'rtl',
                          textAlign: 'right',
                          boxSizing: 'border-box',
                          minHeight: '100px',
                          resize: 'vertical',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={toggleSalonLoading}
                        style={{
                          padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 24px)',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                          color: 'white',
                          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
                          fontWeight: 600,
                          cursor: toggleSalonLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s',
                          opacity: toggleSalonLoading ? 0.7 : 1
                        }}
                      >
                        {toggleSalonLoading ? 'در حال پردازش...' : 'غیرفعال کردن'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setShowDisableSalonForm(false);
                          setDisableSalonForm({ days: '', reason: '' });
                        }}
                        style={{
                          padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 24px)',
                          borderRadius: '12px',
                          border: '2px solid #e2e8f0',
                          background: 'var(--card)',
                          color: "var(--text-secondary)",
                          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.background = 'var(--background-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.background = 'var(--card)';
                        }}
                      >
                        انصراف
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          )}
        </motion.main>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
      />

      <ErrorModal
        open={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ open: false, title: '', message: '' })}
      />

      <SuccessModal
        open={successModal.open}
        message={successModal.message}
        onClose={() => setSuccessModal({ open: false, message: '' })}
      />
    </motion.div>
  );
}

// کامپوننت‌های کمکی

function TabButton({ icon, label, badge, active, onClick }) {
  const badgeText = badge !== undefined && badge !== null ? toPersianNumber(badge) : null;
  return (
    <motion.button
      whileHover={active ? undefined : { y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      style={{
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: 'clamp(10px, 1.5vw, 12px) clamp(12px, 2vw, 16px)',
        marginBottom: '8px',
        borderRadius: '14px',
        border: 'none',
        background: active
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'transparent',
        color: active ? 'white' : '#64748b',
        fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
        fontWeight: 600,
        cursor: 'pointer',
        textAlign: 'right',
        transition: 'all 0.2s ease',
        boxShadow: active ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transformOrigin: 'center right'
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#f1f5f9';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        <span>{label}</span>
      </div>
      {badgeText !== null && (
        <span style={{
          padding: '2px 8px',
          borderRadius: '20px',
          background: active ? 'var(--surface-glass)' : '#e2e8f0',
          fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)',
          fontWeight: 700,
          color: active ? 'white' : '#475569'
        }}>
          {badgeText}
        </span>
      )}
    </motion.button>
  );
}

function StatCard({ icon, value, label, gradient, color }) {
  const valueText = value !== undefined && value !== null ? toPersianNumber(value) : value;
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      style={{
        background: 'var(--card)',
        borderRadius: '24px',
        padding: 'clamp(1rem, 2vw, 1.5rem)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        border: "1px solid var(--border)",
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: gradient
      }} />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(0.75rem, 1.5vw, 1rem)'
      }}>
        <div style={{
          width: 'clamp(40px, 7vw, 56px)',
          height: 'clamp(40px, 7vw, 56px)',
          borderRadius: '16px',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: `0 6px 16px ${color}40`,
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div>
          <div style={{
            fontSize: 'clamp(1.5rem, 3vw, 1.8rem)',
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1
          }}>
            {valueText}
          </div>
          <div style={{
            fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
            color: "var(--text-secondary)",
            marginTop: '4px'
          }}>
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoItem({ icon, label, value, gradient }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 5 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(0.75rem, 1.5vw, 1rem)',
        padding: 'clamp(0.75rem, 1.5vw, 1rem)',
        background: 'var(--background-secondary)',
        borderRadius: '16px',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{
        width: 'clamp(40px, 7vw, 48px)',
        height: 'clamp(40px, 7vw, 48px)',
        borderRadius: '14px',
        background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
          color: "var(--text-secondary)",
          marginBottom: '4px',
          fontWeight: 500
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
          fontWeight: 700,
          color: "var(--text-primary)",
          wordBreak: 'break-word'
        }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}

function WorkingHoursDayCard({ day, onDelete }) {
  const shifts = Array.isArray(day.shifts) ? day.shifts : [];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240 }}
      style={{
        background: 'var(--card)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div style={{
        height: '4px',
        background: shifts.length
          ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
          : 'linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 100%)'
      }} />

      <div style={{ padding: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '14px',
              background: shifts.length
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : '#f1f5f9',
              color: shifts.length ? 'white' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CalendarDays size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: '0.98rem' }}>
                {day.label}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: '0.8rem', marginTop: '0.15rem' }}>
                {shifts.length ? `${toPersianNumber(shifts.length)} شیفت` : 'تعطیل'}
              </div>
            </div>
          </div>

          <span style={{
            padding: '0.35rem 0.65rem',
            borderRadius: '999px',
            background: shifts.length ? 'var(--surface)' : 'var(--background-secondary)',
            color: shifts.length ? '#0e7490' : '#64748b',
            fontSize: '0.76rem',
            fontWeight: 700
          }}>
            {shifts.length ? 'فعال' : 'استراحت'}
          </span>
        </div>

        {shifts.length === 0 ? (
          <div style={{
            background: 'var(--background-secondary)',
            borderRadius: '18px',
            padding: '1rem',
            color: "var(--text-secondary)",
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <Clock3 size={18} />
            <span style={{ fontSize: '0.88rem' }}>برای این روز هنوز شیفتی ثبت نشده است.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {shifts.map((shift, index) => (
              <div
                key={shift.id || `${day.value}-${index}-${shift.start_time}-${shift.end_time}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  background: 'var(--background-secondary)',
                  borderRadius: '16px',
                  padding: '0.8rem 0.9rem',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem',
                    color: "var(--text-secondary)",
                    marginBottom: '0.25rem'
                  }}>
                    شیفت {toPersianNumber(shift.sort_order !== undefined ? Number(shift.sort_order) + 1 : index + 1)}
                  </div>
                  <div style={{
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    fontSize: '0.92rem',
                    wordBreak: 'break-word'
                  }}>
                    {formatWorkingRange(shift.start_time, shift.end_time)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(shift.id)}
                  style={{
                    border: 'none',
                    background: 'var(--danger-surface)',
                    color: '#b91c1c',
                    borderRadius: '999px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}


function FormField({ label, type, value, onChange, placeholder, required }) {
  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
        color: "var(--text-secondary)",
        fontWeight: 600
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: 'clamp(8px, 1.5vw, 12px) clamp(10px, 2vw, 16px)',
          border: '2px solid #e2e8f0',
          borderRadius: '14px',
          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
          color: "var(--text-primary)",
          backgroundColor: 'var(--card)',
          transition: 'all 0.3s ease',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#667eea';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

function PriceField({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
        color: "var(--text-secondary)",
        fontWeight: 600
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={formatPriceInput(value)}
          onChange={(e) => onChange(parsePriceInput(e.target.value))}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: 'clamp(8px, 1.5vw, 12px) clamp(56px, 8vw, 70px) clamp(8px, 1.5vw, 12px) clamp(10px, 2vw, 16px)',
            border: '2px solid #e2e8f0',
            borderRadius: '14px',
            fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
            color: "var(--text-primary)",
            backgroundColor: 'var(--card)',
            transition: 'all 0.3s ease',
            outline: 'none',
            textAlign: 'left',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <span style={{
          position: 'absolute',
          top: '50%',
          right: '14px',
          transform: 'translateY(-50%)',
          fontSize: 'clamp(0.7rem, 1.3vw, 0.85rem)',
          color: "var(--text-muted)",
          fontWeight: 600,
          pointerEvents: 'none'
        }}>
          تومان
        </span>
      </div>
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th style={{
      padding: 'clamp(0.5rem, 1.5vw, 1rem) clamp(0.5rem, 1.5vw, 1.5rem)',
      textAlign: 'right',
      fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
      fontWeight: 700,
      color: "var(--text-secondary)",
      whiteSpace: 'nowrap'
    }} className="admin-tab-button">
      {children}
    </th>
  );
}

function ServiceCard({ service, onToggleStatus, onEdit }) {
  const isActivationBlocked = !service.is_active && Number(service?.price) <= 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240 }}
      style={{
        background: 'var(--card)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div style={{
        height: '4px',
        background: service.is_active
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 100%)'
      }} />

      <div style={{ padding: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '14px',
              background: service.is_active
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#f1f5f9',
              color: service.is_active ? 'white' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Scissors size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 800,
                color: "var(--text-primary)",
                fontSize: '0.98rem',
                wordBreak: 'break-word'
              }}>
                {service.name}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: "var(--text-secondary)",
                fontSize: '0.8rem',
                marginTop: '0.15rem'
              }}>
                <Clock size={13} color="#f093fb" />
                {toPersianNumber(service.duration_minutes)} دقیقه
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleStatus(service)}
            aria-disabled={isActivationBlocked}
            title={isActivationBlocked ? 'برای فعال‌سازی ابتدا قیمت را مشخص کنید' : undefined}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '999px',
              border: 'none',
              background: service.is_active ? '#d1fae5' : '#fee2e2',
              color: service.is_active ? '#065f46' : '#991b1b',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'opacity 0.2s',
              opacity: 1
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {service.is_active ? 'فعال' : 'غیرفعال'}
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--background-secondary)',
          borderRadius: '16px',
          padding: '0.8rem 0.9rem',
          border: '1px solid var(--border)',
          marginBottom: '0.85rem'
        }}>
          <DollarSign size={16} color="#667eea" />
          <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: '0.92rem' }}>
            {formatToman(service.price)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEdit}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '0.6rem',
              borderRadius: '999px',
              border: '2px solid #bfdbfe',
              background: 'var(--card)',
              color: '#2563eb',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
          >
            <Edit2 size={14} />
            ویرایش
          </motion.button>

        </div>
      </div>
    </motion.div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(15, 23, 42, 0.56)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(420px, calc(100vw - 1.5rem))',
              background: 'var(--card)',
              borderRadius: '24px',
              boxShadow: '0 24px 90px rgba(15, 23, 42, 0.35)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              textAlign: 'center'
            }}
          >
            <div style={{
              height: '4px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            }} />
            <div style={{ padding: '2rem 1.5rem 1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--danger-surface)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <AlertCircle size={28} />
              </div>
              <h3 style={{
                color: "var(--text-primary)",
                fontSize: '1.1rem',
                fontWeight: 800,
                margin: '0 0 0.6rem'
              }}>
                {title}
              </h3>
              <p style={{
                color: "var(--text-secondary)",
                fontSize: '0.92rem',
                lineHeight: 1.7,
                margin: '0 0 1.5rem'
              }}>
                {message}
              </p>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '999px',
                    border: '2px solid #e2e8f0',
                    background: 'var(--card)',
                    color: "var(--text-secondary)",
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--background-secondary)';
                    e.currentTarget.style.borderColor = '#94a3b8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  خیر
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(220, 38, 38, 0.3)',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  بله، حذف کن
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ErrorModal({ open, title, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(15, 23, 42, 0.56)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(420px, calc(100vw - 1.5rem))',
              background: 'var(--card)',
              borderRadius: '24px',
              boxShadow: '0 24px 90px rgba(15, 23, 42, 0.35)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              textAlign: 'center'
            }}
          >
            <div style={{
              height: '4px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            }} />
            <div style={{ padding: '2rem 1.5rem 1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--warning-surface)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <AlertCircle size={28} />
              </div>
              <h3 style={{
                color: "var(--text-primary)",
                fontSize: '1.1rem',
                fontWeight: 800,
                margin: '0 0 0.6rem'
              }}>
                {title}
              </h3>
              <p style={{
                color: "var(--text-secondary)",
                fontSize: '0.92rem',
                lineHeight: 1.7,
                margin: '0 0 1.5rem'
              }}>
                {message}
              </p>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(217, 119, 6, 0.3)',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                متوجه شدم
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SuccessModal({ open, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(15, 23, 42, 0.56)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(420px, calc(100vw - 1.5rem))',
              background: 'var(--card)',
              borderRadius: '24px',
              boxShadow: '0 24px 90px rgba(15, 23, 42, 0.35)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              textAlign: 'center'
            }}
          >
            <div style={{
              height: '4px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }} />
            <div style={{ padding: '2rem 1.5rem 1.5rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#d1fae5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <CheckCircle size={28} />
              </div>
              <h3 style={{
                color: "var(--text-primary)",
                fontSize: '1.1rem',
                fontWeight: 800,
                margin: '0 0 0.6rem'
              }}>
                موفقیت
              </h3>
              <p style={{
                color: "var(--text-secondary)",
                fontSize: '0.92rem',
                lineHeight: 1.7,
                margin: '0 0 1.5rem'
              }}>
                {message}
              </p>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                متوجه شدم
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BookingRow({ booking }) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusStyle = (status) => {
    const styles = {
      confirmed: { bg: '#d1fae5', text: '#065f46', label: 'تأیید شده', icon: CheckCircle },
      pending: { bg: '#fef3c7', text: '#92400e', label: 'در انتظار', icon: AlertCircle },
      cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'لغو شده', icon: XCircle }
    };
    return styles[status] || styles.pending;
  };

  const statusStyle = getStatusStyle(booking.status);
  const StatusIcon = statusStyle.icon;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        borderBottom: '1px solid #f1f5f9',
        background: isHovered ? 'var(--background-secondary)' : 'var(--card)',
        transition: 'background 0.2s'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
        <div style={{
          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
          fontWeight: 600,
          color: "var(--text-primary)"
        }}>
          {booking.customer_name}
        </div>
      </td>
      <td style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
        <div style={{
          fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
          color: "var(--text-secondary)"
        }}>
          {booking.services && booking.services.length > 0
            ? booking.services.map(s => s.name).join(' + ')
            : (booking.service?.name || '—')}
        </div>
      </td>
      <td style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
        <div style={{
          fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
          color: "var(--text-secondary)"
        }}>
          {new Date(booking.start_at).toLocaleString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </td>
      <td style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: 'clamp(4px, 1vw, 6px) clamp(10px, 1.5vw, 16px)',
          borderRadius: '30px',
          fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
          fontWeight: 600,
          background: statusStyle.bg,
          color: statusStyle.text,
          whiteSpace: 'nowrap'
        }}>
          <StatusIcon size={14} />
          {statusStyle.label}
        </span>
      </td>
      <td style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
        <div style={{
          fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
          color: "var(--text-secondary)",
          direction: 'ltr',
          textAlign: 'right',
          wordBreak: 'break-word'
        }}>
          {booking.customer_phone}
        </div>
      </td>
    </motion.tr>
  );
}

function WorkingHourRow({ workingHour, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  const daysOfWeek = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const dayName = daysOfWeek[workingHour.day_of_week] || '—';

  const formatTime = (timeString) => {
    if (!timeString) return '—';
    return timeString.slice(0, 5); // HH:MM
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        borderBottom: '1px solid #f1f5f9',
        background: isHovered ? 'var(--background-secondary)' : 'var(--card)',
        transition: 'background 0.2s'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
        <div style={{
          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
          fontWeight: 600,
          color: "var(--text-primary)"
        }}>
          {dayName}
        </div>
      </td>
      <td style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
        <div style={{
          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
          color: "var(--text-secondary)",
          fontWeight: 500
        }}>
          {formatTime(workingHour.start_time)}
        </div>
      </td>
      <td style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
        <div style={{
          fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
          color: "var(--text-secondary)",
          fontWeight: 500
        }}>
          {formatTime(workingHour.end_time)}
        </div>
      </td>
      <td style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem)' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(workingHour.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: 'clamp(6px, 1vw, 8px) clamp(10px, 1.5vw, 16px)',
            borderRadius: '30px',
            border: '2px solid #fecaca',
            background: 'var(--card)',
            color: '#dc2626',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dc2626';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card)';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.borderColor = '#fecaca';
          }}
        >
          <Trash2 size={14} />
          حذف
        </motion.button>
      </td>
    </motion.tr>
  );
}