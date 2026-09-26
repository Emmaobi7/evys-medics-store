import React from 'react';
import { Truck, PhoneCall, ShieldCheck } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="announcement-bar">
      <div className="container">
        {/* Desktop View: Full Trust Bar */}
        <div className="announcement-content desktop-only">
          <span className="announcement-item">
            <Truck size={13} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <span>Free Delivery on orders over £50</span>
          </span>
          <span className="announcement-bullet">•</span>
          <span className="announcement-item">
            <ShieldCheck size={13} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <span>Professional Medical &amp; Laboratory Supplies</span>
          </span>
          <span className="announcement-bullet">•</span>
          <span className="announcement-item">
            <PhoneCall size={13} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <span>Practice Support: 0800 456 7890</span>
          </span>
        </div>

        {/* Mobile View: Compact Single-Line Crisp Banner */}
        <div className="announcement-content mobile-only">
          <span className="announcement-item">
            <Truck size={12} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <span>Free Delivery &gt; £50</span>
          </span>
          <span className="announcement-bullet">•</span>
          <a href="tel:08004567890" className="announcement-item" style={{ color: 'inherit', textDecoration: 'none' }}>
            <PhoneCall size={12} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
            <span>0800 456 7890</span>
          </a>
        </div>
      </div>
    </div>
  );
};

