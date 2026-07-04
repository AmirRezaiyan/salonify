import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { FieldErrorBox } from '../components/FieldErrorBox';
import { 
  Scissors,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  DollarSign,
  Clock
} from 'lucide-react';
import { formatToman, toPersianNumber } from '../utils/formatCurrency';

export default function ServiceManager() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    price: '', 
    duration_minutes: '30',
    is_active: true 
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const salonId = user?.salon?.id || localStorage.getItem('salon_id');

  const fetchServices = async () => {
    if (!salonId) return;
    
    setLoading(true);
    try {
      const response = await api.getServices(salonId);
      setServices(response.data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('خطا در بارگذاری خدمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (salonId) {
      fetchServices();
    }
  }, [salonId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) setError('');
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEdit = service => {
    setEditingId(service.id);
    setForm({ 
      name: service.name, 
      price: service.price.toString(), 
      duration_minutes: service.duration_minutes.toString(),
      is_active: service.is_active
    });
    setErrors({});
  };

  const handleDelete = async id => {
    if (!window.confirm('آیا از حذف این سرویس مطمئن هستید؟')) return;
    
    try {
      setSubmitting(true);
      await api.deleteService(id);
      await fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('خطا در حذف سرویس');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'نام خدمت الزامی است';
    }
    
    if (!form.price) {
      newErrors.price = 'قیمت الزامی است';
    } else if (parseFloat(form.price) <= 0) {
      newErrors.price = 'قیمت باید بزرگ‌تر از صفر باشد';
    }
    
    if (!form.duration_minutes) {
      newErrors.duration_minutes = 'مدت زمان الزامی است';
    } else if (parseInt(form.duration_minutes) < 1) {
      newErrors.duration_minutes = 'مدت زمان باید حداقل ۱ دقیقه باشد';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setError('');
    setErrors({});
    setSubmitting(true);
    
    try {
      const serviceData = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        duration_minutes: parseInt(form.duration_minutes),
        is_active: form.is_active,
        salon: salonId
      };
      
      if (editingId) {
        await api.updateService(editingId, serviceData);
      } else {
        await api.createService(serviceData);
      }
      
      setForm({ name: '', price: '', duration_minutes: '30', is_active: true });
      setEditingId(null);
      await fetchServices();
    } catch (err) {
      console.error('Error saving service:', err);
      setError(editingId ? 'خطا در ویرایش سرویس' : 'خطا در افزودن سرویس');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', price: '', duration_minutes: '30', is_active: true });
    setError('');
    setErrors({});
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background-secondary)',
      color: 'var(--text-primary)',
      padding: '2rem 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* هدر */}
        <div style={{
          background: 'var(--card)',
          borderRadius: '12px',
          padding: '2rem',
          border: '1px solid #e9ecef',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Scissors size={28} />
            مدیریت خدمات
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            در این بخش می‌توانید خدمات سالن خود را مدیریت کنید.
          </p>
        </div>

        {/* فرم */}
        <div style={{
          background: 'var(--card)',
          borderRadius: '12px',
          padding: '2rem',
          border: '1px solid #e9ecef',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: 600,
            color: '#52555D',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {editingId ? (
              <>
                <Edit size={20} />
                ویرایش خدمت
              </>
            ) : (
              <>
                <Plus size={20} />
                افزودن خدمت جدید
              </>
            )}
          </h2>
          
          {error && (
            <Alert 
              type="error" 
              message={error} 
              onClose={() => setError('')}
              style={{ marginBottom: '1.5rem' }}
            />
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              {/* نام خدمت */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#52555D',
                  fontWeight: 500
                }}>
                  نام خدمت
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="مثال: اصلاح مو، گریم داماد"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: errors.name ? '1.5px solid #fca5ac' : '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#52555D',
                    backgroundColor: errors.name ? 'var(--danger-surface)' : 'var(--card)',
                    transition: 'border-color 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = errors.name ? '#f5576c' : '#52555D'}
                  onBlur={(e) => e.target.style.borderColor = errors.name ? '#fca5ac' : '#dee2e6'}
                  required
                />
                {errors.name && <FieldErrorBox message={errors.name} />}
              </div>
              
              {/* قیمت */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#52555D',
                  fontWeight: 500
                }}>
                  قیمت (تومان)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="مثال: 50000"
                    min="0"
                    step="1000"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 3rem',
                      border: errors.price ? '1.5px solid #fca5ac' : '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      backgroundColor: errors.price ? 'var(--danger-surface)' : 'var(--card)',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = errors.price ? '#f5576c' : 'var(--border)'}
                    onBlur={(e) => e.target.style.borderColor = errors.price ? '#fca5ac' : 'var(--border)'}
                    required
                  />
                  <DollarSign 
                    size={18} 
                    color={errors.price ? '#f5576c' : '#6c757d'}
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
                {errors.price && <FieldErrorBox message={errors.price} />}
              </div>
              
              {/* مدت زمان */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#52555D',
                  fontWeight: 500
                }}>
                  مدت زمان (دقیقه)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={handleChange}
                    placeholder="مثال: 30"
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 3rem',
                      border: errors.duration_minutes ? '1.5px solid #fca5ac' : '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      backgroundColor: errors.duration_minutes ? 'var(--danger-surface)' : 'var(--card)',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = errors.duration_minutes ? '#f5576c' : 'var(--border)'}
                    onBlur={(e) => e.target.style.borderColor = errors.duration_minutes ? '#fca5ac' : 'var(--border)'}
                    required
                  />
                  <Clock 
                    size={18} 
                    color={errors.duration_minutes ? '#f5576c' : '#6c757d'}
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
                {errors.duration_minutes && <FieldErrorBox message={errors.duration_minutes} />}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Button 
                type="submit" 
                style={{ backgroundColor: 'var(--text-secondary)' }}
                disabled={submitting}
              >
                {submitting ? (
                  'در حال ذخیره...'
                ) : editingId ? (
                  <>
                    <Check size={18} style={{ marginLeft: '0.5rem' }} />
                    ویرایش خدمت
                  </>
                ) : (
                  <>
                    <Plus size={18} style={{ marginLeft: '0.5rem' }} />
                    افزودن خدمت
                  </>
                )}
              </Button>
              
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancel}
                  style={{ borderColor: '#52555D', color: '#52555D' }}
                >
                  <X size={18} style={{ marginLeft: '0.5rem' }} />
                  انصراف
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* لیست خدمات */}
        <div style={{
          background: 'var(--card)',
          borderRadius: '12px',
          border: '1px solid #e9ecef',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '1.3rem',
              fontWeight: 600,
              color: '#52555D',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Scissors size={20} />
              لیست خدمات ({services.length})
            </h2>
            
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--background-secondary)',
              borderRadius: '20px',
              fontSize: '0.9rem',
              color: 'var(--text-primary)'
            }}>
              {toPersianNumber(services.filter(s => s.is_active).length)} فعال
            </div>
          </div>
          
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#6c757d'
            }}>
              در حال بارگذاری خدمات...
            </div>
          ) : services.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#6c757d'
            }}>
              <Scissors size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                هنوز خدمتی ثبت نشده است
              </p>
              <p style={{ fontSize: '0.9rem' }}>
                برای شروع، خدمت جدیدی اضافه کنید
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '600px'
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: 'var(--surface)',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#52555D',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>نام خدمت</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#52555D',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>قیمت</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#52555D',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>مدت زمان</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#52555D',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>وضعیت</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#52555D',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr 
                      key={service.id}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {service.name}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#52555D' }}>
                          <DollarSign size={16} />
                          <span style={{ fontWeight: 600 }}>{formatToman(service.price)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#52555D' }}>
                          <Clock size={16} />
                          {toPersianNumber(service.duration_minutes)} دقیقه
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          backgroundColor: service.is_active ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                          color: service.is_active ? 'var(--success)' : 'var(--danger)',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: service.is_active ? '#4CAF50' : '#f44336'
                          }} />
                          {service.is_active ? 'فعال' : 'غیرفعال'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEdit(service)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'transparent',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--surface-glass)';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                          >
                            <Edit size={16} />
                            ویرایش
                          </button>
                          
                          <button
                            onClick={() => handleDelete(service.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid var(--danger)',
                              backgroundColor: 'transparent',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--danger)';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--danger)';
                            }}
                            disabled={submitting}
                          >
                            <Trash2 size={16} />
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
