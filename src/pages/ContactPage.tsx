import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Building2, Send, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { submitContactInquiry } from '../api/client';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContactInquiry(formData);
      setIsSubmitted(true);
      showToast(
        'Message Received',
        'Our clinical procurement team has logged your inquiry and will respond promptly.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit inquiry. Please try again.');
      showToast('Submission Error', err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
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
              {errorMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div>{errorMessage}</div>
                </div>
              )}

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
                    placeholder="e.vance@clinic.com"
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
                    placeholder="e.g. Apex Health Clinic"
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
                    placeholder="e.g. +234 800 000 0000"
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
                  <option value="bulk-order">Bulk / Wholesale Order Quote</option>
                  <option value="technical">Technical Datasheets &amp; Compliance</option>
                  <option value="delivery">Order &amp; Delivery Tracking</option>
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

              <Button variant="primary" size="lg" type="submit" isLoading={isSubmitting} icon={<Send size={18} />}>
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
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Telephone Support Line</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)' }}>Customer Support &amp; Orders</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Direct Procurement Assistance</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Direct Procurement Support</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)' }}>Online Inquiry &amp; Dispatch</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Submit orders and requests via the contact form</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)' }}>Operations &amp; Distribution</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)' }}>Central Logistics Hub</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>Medical &amp; Laboratory Supplies</div>
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
