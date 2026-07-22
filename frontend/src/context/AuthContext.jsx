import { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      // Try to get freshest user data from server; fallback to stored user_data
      const fetchUser = async () => {
        try {
          const resp = await api.getCurrentUser();
          const userInfo = resp.data?.user;
          if (userInfo) {
            const userToStore = {
              id: userInfo.id,
              username: userInfo.username,
              email: userInfo.email,
              role: userInfo.role || 'customer',
              phone_number: userInfo.phone_number || userInfo.phone || '',
              phone: userInfo.phone || '',
              gender: userInfo.gender || '',
              city: userInfo.city || '',  // ← اضافه شد
            };
            if (userInfo.salon) {
              userToStore.salon = userInfo.salon;
              try {
                localStorage.setItem('selected_salon_id', userInfo.salon.id);
                localStorage.setItem('selected_salon_name', userInfo.salon.name || '');
                localStorage.setItem('salon_id', userInfo.salon.id);
              } catch (e) {}
            }
            localStorage.setItem('user_data', JSON.stringify(userToStore));
            setUser(userToStore);
            return;
          }
        } catch (e) {
          // ignore fetch error and fallback
        }

        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsed = JSON.parse(userData);
          // اطمینان از وجود city در صورت نبودن (نسخه قبلی)
          if (!parsed.city) parsed.city = '';
          setUser(parsed);
        }
      };
      fetchUser();
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.login(username, password);
      const { access, refresh, user: userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const userToStore = {
        id: userData?.id,
        username: userData?.username || username,
        email: userData?.email || '',
        role: userData?.role || 'customer',
        phone_number: userData?.phone_number || userData?.phone || '',
        phone: userData?.phone || '',
        gender: userData?.gender || '',
        city: userData?.city || '',  // ← اضافه شد
      };
      
      // اگر کاربر مالک یا کارمند است، اطلاعات سالن را شامل کنید
      if (userData?.salon) {
        userToStore.salon = userData.salon;
      }
      // اگر اطلاعات سالن وجود دارد، انتخاب سالن پیش‌فرض را در localStorage قرار بده
      if (userToStore.salon) {
        try {
          localStorage.setItem('selected_salon_id', userToStore.salon.id);
          localStorage.setItem('selected_salon_name', userToStore.salon.name || '');
          localStorage.setItem('salon_id', userToStore.salon.id);
        } catch (e) {
          // ignore storage errors
        }
      }
      localStorage.setItem('user_data', JSON.stringify(userToStore));
      localStorage.removeItem('customer_phone');

      setUser(userToStore);
      setIsAuthenticated(true);
      return { success: true, user: { id: userToStore.id, username: userToStore.username, role: userToStore.role } };
    } catch (error) {
      const errData = error.response?.data;
      if (errData && typeof errData === 'object' && !Array.isArray(errData)) {
        if (errData.detail && typeof errData.detail === 'object') {
          return { success: false, fieldErrors: errData.detail };
        }
        const hasFieldKeys = Object.keys(errData).some(k => ['username', 'password', 'general'].includes(k));
        if (hasFieldKeys) {
          return { success: false, fieldErrors: errData };
        }
      }
      return { 
        success: false, 
        error: (errData && errData.detail) || (errData && errData.error) || 'ورود ناموفق بود' 
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await api.register(data);
      const userInfo = response.data.user;
      
      const userToStore = {
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role || 'customer',
        phone_number: userInfo.phone_number || userInfo.phone || '',
        phone: userInfo.phone || '',
        gender: userInfo.gender || '',
        city: userInfo.city || '',  // ← اضافه شد
      };
      
      localStorage.setItem('user_data', JSON.stringify(userToStore));
      localStorage.removeItem('customer_phone');
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Registration error:', error);
      
      const errorData = error.response?.data;
      console.log('Error data from backend:', errorData);

      const translateError = (field, msg) => {
        const m = String(msg).toLowerCase();
        if (m.includes('already exists') || m.includes('unique') || m.includes('قبلاً ثبت شده')) {
          const map = {
            email: 'این ایمیل قبلاً ثبت شده است',
            phone_number: 'این شماره تلفن قبلاً ثبت شده است',
            username: 'این نام کاربری قبلاً ثبت شده است',
            city: 'این شهر قبلاً ثبت شده است', // اگر لازم باشد
          };
          return map[field] || 'این مقدار قبلاً ثبت شده است';
        }
        if (m.includes('too short') || m.includes('at least 8')) return 'رمز عبور باید حداقل ۸ کاراکتر باشد';
        if (m.includes('too common') || m.includes('common')) return 'رمز عبور خیلی ساده است';
        if (m.includes('entirely numeric') || m.includes('numeric')) return 'رمز عبور نباید فقط عدد باشد';
        if (m.includes('similar to') || m.includes('similar')) return 'رمز عبور نباید شبیه اطلاعات شخصی باشد';
        if (m.includes('valid') || m.includes('invalid') || m.includes('معتبر نیست')) {
          const map = {
            email: 'فرمت ایمیل صحیح نیست (مثال: user@example.com)',
            phone_number: 'شماره تلفن معتبر نیست (حداقل ۱۰ رقم)',
          };
          return map[field] || msg;
        }
        return msg;
      };

      if (errorData && typeof errorData === 'object') {
        const hasOnlyGeneralKeys = errorData.detail || errorData.error || errorData.non_field_errors;
        const hasFieldKeys = Object.keys(errorData).some(
          k => !['detail', 'error', 'non_field_errors'].includes(k)
        );

        if (hasFieldKeys) {
          const errors = {};
          for (const [key, value] of Object.entries(errorData)) {
            if (['detail', 'error', 'non_field_errors'].includes(key)) continue;
            const raw = Array.isArray(value) ? (value[0] || 'خطای نامشخص') : String(value);
            errors[key] = translateError(key, raw);
          }
          if (errorData.non_field_errors) {
            const nfe = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
            errors.password = errors.password || String(nfe);
          }
          return { success: false, errors };
        }

        if (hasOnlyGeneralKeys) {
          const nfe = errorData.non_field_errors;
          const msg = errorData.detail || errorData.error ||
            (Array.isArray(nfe) ? nfe[0] : (typeof nfe === 'string' ? nfe : 'ثبت نام ناموفق بود'));
          return { success: false, error: msg };
        }
        
        return { success: false, error: 'ثبت نام ناموفق بود' };
      } else if (typeof errorData === 'string') {
        return { success: false, error: errorData };
      } else {
        return { success: false, error: 'ثبت نام ناموفق بود' };
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setIsAuthenticated(false);
  };

  // تابع کمکی برای به‌روزرسانی دستی کاربر (مثلاً بعد از تغییر پروفایل)
  const refreshUser = async () => {
    try {
      const resp = await api.getCurrentUser();
      const userInfo = resp.data?.user;
      if (userInfo) {
        const userToStore = {
          id: userInfo.id,
          username: userInfo.username,
          email: userInfo.email,
          role: userInfo.role || 'customer',
          phone_number: userInfo.phone_number || userInfo.phone || '',
          phone: userInfo.phone || '',
          gender: userInfo.gender || '',
          city: userInfo.city || '',
        };
        if (userInfo.salon) {
          userToStore.salon = userInfo.salon;
        }
        localStorage.setItem('user_data', JSON.stringify(userToStore));
        setUser(userToStore);
        return userToStore;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated, 
      login, 
      register, 
      logout, 
      redirectTo, 
      setRedirectTo,
      refreshUser  
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};