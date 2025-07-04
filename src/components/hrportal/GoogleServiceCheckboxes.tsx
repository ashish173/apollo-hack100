import React from 'react';

export type GoogleService = 'gmail' | 'calendar' | 'meet';

interface GoogleServiceCheckboxesProps {
  checked: Record<GoogleService, boolean>;
  onChange: (service: GoogleService, checked: boolean) => void;
  disabled?: Record<GoogleService, boolean>;
}

const SERVICE_LABELS: Record<GoogleService, string> = {
  gmail: 'Gmail',
  calendar: 'Google Calendar',
  meet: 'Google Meet',
};

const GoogleServiceCheckboxes: React.FC<GoogleServiceCheckboxesProps> = ({ checked, onChange, disabled }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['gmail', 'calendar', 'meet'] as GoogleService[]).map(service => (
        <label key={service} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
          <input
            type="checkbox"
            checked={checked[service]}
            onChange={e => onChange(service, e.target.checked)}
            disabled={disabled ? disabled[service] : false}
          />
          {SERVICE_LABELS[service]}
        </label>
      ))}
    </div>
  );
};

export default GoogleServiceCheckboxes; 