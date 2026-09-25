import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Building2, Send, ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';

interface ContactPageProps {
  initialReason?: string;
  onNavigateHome: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  initialReason = 'general',
  onNavigateHome,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organisation: '',
    phone: '',
    enquiryType: initialReason === 'bulk' ? 'bulk-order' : 'general',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    showToast(
      'Message Received',
      'Our clinical procurement team will respond within 2 business hours.'
    );
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      {/* Breadcrumbs */}
      <nav style={{ padding: '20px 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
        <a href="#home" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
          Home
        </a>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>Contact &amp; Clinic Procurement</span>
      </nav>

      <div style={{ maxWidth: '700px', marginBottom: '40px' }}>
        <div className="section-eyebrow">Direct Healthcare Support</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>
          Connect with Our Medical Specialists
        </h1>
        <p style={{ fontSize: '1.0625rem', color: 'var(--color-muted)' }}>
          Whether you need bulk practice quotes, tender procurement, product datasheets, or order assistance, our dedicated team is here to help.
        </p>
      </div>

      <div className="contact-page-grid">
        {/* Contact Form */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            padding: '36px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
          className="contact-form-card"
        >
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success-bg)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                }}
              >
                <Send size={28} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>Enquiry Submitted Successfully</h2>
              <p style={{ marginBottom: '24px' }}>
                Thank you, <strong>{formData.fullName}</strong>. A dedicated medical accounts officer will contact you shortly at <strong>{formData.email}</strong>.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    fullName: '',
                    email: '',
                    organisation: '',
                    phone: '',
                    enquiryType: 'general',
                    message: '',
                  });
                }}
              >
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-row-2col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Eleanor Vance"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9375rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Professional Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.vance@trust.nhs.uk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9375rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Clinic / Organisation Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marylebone Medical Practice"
                    value={formData.organisation}
                    onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9375rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    Telephone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="020 7946 0192"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9375rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  Enquiry Subject / Department
                </label>
                <select
                  value={formData.enquiryType}
                  onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9375rem',
                    backgroundColor: 'var(--color-white)',
                  }}
                >
                  <option value="general">General Product Enquiry</option>
                  <option value="bulk-order">Bulk Practice / Clinic Order Quote</option>
                  <option value="nhs-account">NHS 30-Day Credit Application</option>
                  <option value="technical">Technical Datasheets &amp; Compliance</option>
                  <option value="delivery">Existing Order &amp; Delivery Tracking</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  Details / Required Supplies *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please specify product quantities, specifications, or practice requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9375rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <Button variant="primary" size="lg" type="submit" icon={<Send size={18} />}>
                Send Message to Specialist
              </Button>
            </form>
          )}
        </div>

        {/* Contact Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: 'var(--color-white)', padding: '28px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>Direct Support Channels</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Telephone Order Line</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)' }}>0800 456 7890</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Freephone (UK Mainland)</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Official Procurement Email</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)' }}>orders@mazimedics.co.uk</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>2-hour guaranteed triage</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Headquarters &amp; Showroom</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>142 Harley Street</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>Marylebone, London W1G 7LB</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Operating Hours</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)' }}>Monday – Friday: 8:30am – 5:30pm</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Emergency On-Call Dispatch Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
