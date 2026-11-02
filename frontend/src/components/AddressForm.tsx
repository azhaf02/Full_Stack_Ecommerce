import { useState, type ChangeEvent, type FormEvent } from 'react';
import FormField from './FormField';
import Button from './Button';
import type { Address, AddressInput, AddressType } from '../types/auth';

interface AddressFormProps {
  initial?: Address;
  onSubmit: (data: AddressInput) => Promise<void>;
  onCancel: () => void;
}

const empty: AddressInput = {
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  address_type: 'both',
  is_default: false,
};

const typeLabels: Record<AddressType, string> = {
  both: 'Shipping and billing',
  shipping: 'Shipping only',
  billing: 'Billing only',
};

export default function AddressForm({ initial, onSubmit, onCancel }: AddressFormProps) {
  const [form, setForm] = useState<AddressInput>(initial ? { ...initial, line2: initial.line2 ?? '' } : empty);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});
  const [saving, setSaving] = useState(false);

  const update = (field: keyof AddressInput) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate() {
    const found: typeof errors = {};
    if (form.full_name.trim().length < 2) found.full_name = 'Enter the receiver’s name.';
    if (!/^[0-9+\- ]{7,20}$/.test(form.phone.trim())) found.phone = 'Enter a valid phone number.';
    if (form.line1.trim().length < 3) found.line1 = 'Enter the house / street.';
    if (form.city.trim().length < 2) found.city = 'Enter the city.';
    if (form.state.trim().length < 2) found.state = 'Enter the state.';
    if (!/^[0-9A-Za-z\- ]{3,20}$/.test(form.postal_code.trim())) found.postal_code = 'Enter a valid PIN code.';
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({ ...form, line2: form.line2?.trim() ? form.line2.trim() : null });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-xl border border-viora-sage bg-white p-5">
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormField label="Full name" name="full_name" value={form.full_name} onChange={update('full_name')} error={errors.full_name} />
        <FormField label="Phone" name="phone" type="tel" value={form.phone} onChange={update('phone')} error={errors.phone} />
      </div>
      <FormField label="House / street" name="line1" value={form.line1} onChange={update('line1')} error={errors.line1} />
      <FormField label="Area / landmark (optional)" name="line2" value={form.line2 ?? ''} onChange={update('line2')} />
      <div className="grid gap-x-4 sm:grid-cols-3">
        <FormField label="City" name="city" value={form.city} onChange={update('city')} error={errors.city} />
        <FormField label="State" name="state" value={form.state} onChange={update('state')} error={errors.state} />
        <FormField label="PIN code" name="postal_code" value={form.postal_code} onChange={update('postal_code')} error={errors.postal_code} />
      </div>
      <div className="mb-4">
        <label htmlFor="address_type" className="mb-1.5 block text-sm font-medium text-viora-ink">
          Use this address for
        </label>
        <select
          id="address_type"
          value={form.address_type}
          onChange={update('address_type')}
          className="w-full rounded-lg border border-viora-sage bg-white px-3.5 py-2.5 text-sm text-viora-ink outline-none focus:border-viora-olive focus:ring-2 focus:ring-viora-olive/25"
        >
          {(Object.keys(typeLabels) as AddressType[]).map((t) => (
            <option key={t} value={t}>
              {typeLabels[t]}
            </option>
          ))}
        </select>
      </div>
      {!initial && (
        <label className="mb-5 flex items-center gap-2 text-sm text-viora-ink">
          <input
            type="checkbox"
            checked={Boolean(form.is_default)}
            onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
            className="h-4 w-4 accent-viora-olive"
          />
          Make this my default address
        </label>
      )}
      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          {initial ? 'Save address' : 'Add address'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
