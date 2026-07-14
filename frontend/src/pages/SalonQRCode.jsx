import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';
import QRCode from 'qrcode';
import '../styles/SalonQRCode.css';

const SalonQRCode = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
  const pageDirection = isEnglish ? 'ltr' : 'rtl';
  const textAlignment = isEnglish ? 'left' : 'right';
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [salonInfo, setSalonInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'owner' || !user?.salon) {
      setError(t('qrCode.ownerOnly'));
      setLoading(false);
      return;
    }

    const fetchQRCode = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/my-salon/qr-code/');
        const data = response.data;
        
        setSalonInfo(data);
        
        const qrUrl = `${window.location.origin}/qr/${data.qr_code}`;
        const dataUrl = await QRCode.toDataURL(qrUrl, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.95,
          margin: 2,
          width: 300,
          color: {
            dark: '#000000',
            light: 'var(--card)',
          },
        });
        
        setQrCodeUrl(dataUrl);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('خطا در دریافت QR Code:', err);
        setError(err.response?.data?.error || t('qrCode.loadError'));
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [isAuthenticated, user, navigate]);

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${salonInfo?.salon_name || 'salon'}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    if (!qrCodeUrl) return;

    const printWindow = window.open();
    const html = `
      <!DOCTYPE html>
      <html dir="${language === 'en' ? 'ltr' : 'rtl'}">
      <head>
        <title>${t('qrCode.printTitle', { salonName: salonInfo?.salon_name || 'Salon' })}</title>
        <style>
          body {
            text-align: center;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          h1 {
            color: var(--text-primary);
            margin-bottom: 20px;
          }
          .qr-container {
            display: flex;
            justify-content: center;
            margin: 30px 0;
          }
          img {
            border: 2px solid #333;
            padding: 10px;
            background: var(--card);
          }
          .info {
            margin-top: 30px;
            color: #555;
            font-size: 14px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <h1>${salonInfo?.salon_name || 'Salon'}</h1>
        <p>${t('qrCode.title')}</p>
        <div class="qr-container">
          <img src="${qrCodeUrl}" alt="QR Code"/>
        </div>
        <div class="info">
          <p>${t('qrCode.scanInfo')}</p>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  if (loading) {
    return (
      <div className="qr-code-page" style={{ direction: pageDirection, textAlign: textAlignment }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('qrCode.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-code-page" style={{ direction: pageDirection, textAlign: textAlignment }}>
        <div className="error-container">
          <h2>{t('qrCode.errorTitle')}</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>{t('qrCode.returnHome')}</button>
        </div>
      </div>
    );
  }

  if (!qrCodeUrl || !salonInfo) {
    return (
      <div className="qr-code-page" style={{ direction: pageDirection, textAlign: textAlignment }}>
        <div className="error-container">
          <h2>{t('qrCode.errorTitle')}</h2>
          <p>{t('qrCode.noInfo')}</p>
          <button onClick={() => navigate('/')}>{t('qrCode.returnHome')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-code-page" style={{ direction: pageDirection, textAlign: textAlignment }}>
      <div className="qr-code-container">
        <h1>{t('qrCode.title')}</h1>
        <p className="salon-name">{salonInfo.salon_name}</p>

        <div className="qr-code-display">
          <img src={qrCodeUrl} alt="QR Code" className="qr-image" />
          <p className="qr-info">
            {t('qrCode.scanInfo')}
          </p>
        </div>

        <div className="qr-code-url">
          <p>{t('qrCode.linkLabel')}</p>
          <code>{salonInfo.qr_url}</code>
        </div>

        <div className="action-buttons">
          <button className="btn btn-primary" onClick={downloadQRCode}>
            {t('qrCode.download')}
          </button>
          <button className="btn btn-secondary" onClick={printQRCode}>
            {t('qrCode.print')}
          </button>
        </div>

        <div className="instructions">
          <h3>{t('qrCode.instructions')}</h3>
          <ol>
            <li>{t('qrCode.instruction1')}</li>
            <li>{t('qrCode.instruction2')}</li>
            <li>{t('qrCode.instruction3')}</li>
            <li>{t('qrCode.instruction4')}</li>
          </ol>
        </div>

        <button className="btn btn-back" onClick={() => navigate('/')}>
          {t('qrCode.back')}
        </button>
      </div>
    </div>
  );
};

export default SalonQRCode;
