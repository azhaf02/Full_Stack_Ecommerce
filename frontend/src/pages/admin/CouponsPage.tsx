import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api.js';

type DiscountType = 'PERCENTAGE' | 'FIXED';

interface Coupon {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  start_date: string;
  expiry_date: string;
  usage_limit: number | null;
  per_user_limit: number | null;
  status: boolean;
}

interface CouponForm {
  code: string;
  discount_type: DiscountType;
  discount_value: string;
  min_order_value: string;
  max_discount: string;
  start_date: string;
  expiry_date: string;
  usage_limit: string;
  per_user_limit: string;
}

const emptyForm: CouponForm = {
  code: '',
  discount_type: 'PERCENTAGE',
  discount_value: '',
  min_order_value: '',
  max_discount: '',
  start_date: '',
  expiry_date: '',
  usage_limit: '',
  per_user_limit: '',
};

function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // =========================
  // LOAD COUPONS
  // =========================
  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/api/cart/admin/coupons');

      setCoupons(response.data);
    } catch (err: any) {
      console.error('Load coupons error:', err);

      setError(
        err?.response?.data?.detail ||
          'Unable to load coupons.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // =========================
  // COUNTS
  // =========================
  const activeCount = coupons.filter(
    (coupon) => coupon.status
  ).length;

  const inactiveCount = coupons.filter(
    (coupon) => !coupon.status
  ).length;

  // =========================
  // FILTER
  // =========================
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesSearch = coupon.code
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && coupon.status) ||
        (statusFilter === 'INACTIVE' && !coupon.status);

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  // =========================
  // DATE
  // =========================
  const formatDate = (date: string) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // =========================
  // DISCOUNT
  // =========================
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'PERCENTAGE') {
      return `${coupon.discount_value}%`;
    }

    return `₹${Number(
      coupon.discount_value
    ).toLocaleString('en-IN')}`;
  };

  // =========================
  // FORM
  // =========================
  const updateField = (
    field: keyof CouponForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);

    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),

      min_order_value:
        coupon.min_order_value !== null
          ? String(coupon.min_order_value)
          : '',

      max_discount:
        coupon.max_discount !== null
          ? String(coupon.max_discount)
          : '',

      start_date: coupon.start_date
        ? coupon.start_date.slice(0, 16)
        : '',

      expiry_date: coupon.expiry_date
        ? coupon.expiry_date.slice(0, 16)
        : '',

      usage_limit:
        coupon.usage_limit !== null
          ? String(coupon.usage_limit)
          : '',

      per_user_limit:
        coupon.per_user_limit !== null
          ? String(coupon.per_user_limit)
          : '',
    });

    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCoupon(null);
    setForm(emptyForm);
    setError('');
  };

  // =========================
  // VALIDATION
  // =========================
  const validateForm = () => {
    if (!form.code.trim()) {
      return 'Coupon code is required.';
    }

    const discount = Number(form.discount_value);

    if (!form.discount_value || discount <= 0) {
      return 'Discount value must be greater than 0.';
    }

    if (
      form.discount_type === 'PERCENTAGE' &&
      discount > 100
    ) {
      return 'Percentage discount cannot exceed 100%.';
    }

    if (!form.start_date || !form.expiry_date) {
      return 'Start date and expiry date are required.';
    }

    if (
      new Date(form.start_date) >=
      new Date(form.expiry_date)
    ) {
      return 'Expiry date must be after start date.';
    }

    return '';
  };

  // =========================
  // CREATE / UPDATE
  // =========================
  const saveCoupon = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        code: form.code.trim().toUpperCase(),

        discount_type: form.discount_type,

        discount_value: Number(
          form.discount_value
        ),

        min_order_value: form.min_order_value
          ? Number(form.min_order_value)
          : null,

        max_discount: form.max_discount
          ? Number(form.max_discount)
          : null,

        start_date: new Date(
          form.start_date
        ).toISOString(),

        expiry_date: new Date(
          form.expiry_date
        ).toISOString(),

        usage_limit: form.usage_limit
          ? Number(form.usage_limit)
          : null,

        per_user_limit: form.per_user_limit
          ? Number(form.per_user_limit)
          : null,

        status: true,
      };

      if (editingCoupon) {
        await api.put(
          `/api/cart/admin/coupons/${editingCoupon.id}`,
          payload
        );

        setSuccess(
          'Coupon updated successfully.'
        );
      } else {
        await api.post(
          '/api/cart/admin/coupons',
          payload
        );

        setSuccess(
          'Coupon created successfully.'
        );
      }

      setShowModal(false);
      setEditingCoupon(null);
      setForm(emptyForm);

      await loadCoupons();

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Save coupon error:', err);

      setError(
        err?.response?.data?.detail ||
          'Unable to save coupon.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DEACTIVATE
  // =========================
  const deactivateCoupon = async (
    coupon: Coupon
  ) => {
    const confirmed = window.confirm(
      `Deactivate coupon "${coupon.code}"?`
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await api.patch(
        `/api/cart/admin/coupons/${coupon.id}/deactivate`,
        {}
      );

      setSuccess(
        `"${coupon.code}" has been deactivated.`
      );

      await loadCoupons();

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error(
        'Deactivate coupon error:',
        err
      );

      setError(
        err?.response?.data?.detail ||
          'Unable to deactivate coupon.'
      );
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f1e8',
        padding: '32px',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                color: '#6d7650',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '7px',
              }}
            >
              VIORA ADMIN
            </div>

            <h1
              style={{
                margin: 0,
                color: '#27301d',
                fontSize: '32px',
                fontWeight: 800,
              }}
            >
              Coupon Management
            </h1>

            <p
              style={{
                margin: '7px 0 0',
                color: '#73786c',
                fontSize: '15px',
              }}
            >
              Create, manage and monitor promotional coupons.
            </p>
          </div>

          <button
            onClick={openAddModal}
            style={{
              border: 'none',
              background: '#68744d',
              color: '#fff',
              padding: '13px 22px',
              borderRadius: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow:
                '0 7px 18px rgba(76, 88, 53, 0.20)',
            }}
          >
            + Create Coupon
          </button>
        </div>

        {/* ALERTS */}
        {success && (
          <div
            style={{
              background: '#e8f3e5',
              color: '#38612e',
              border: '1px solid #c9dfc4',
              padding: '13px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
            }}
          >
            ✓ {success}
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fff0ed',
              color: '#9b3c32',
              border: '1px solid #f0c9c3',
              padding: '13px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* STAT CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
            marginBottom: '25px',
          }}
        >
          <StatCard
            title="Total Coupons"
            value={coupons.length}
            icon="🎟️"
          />

          <StatCard
            title="Active Coupons"
            value={activeCount}
            icon="✓"
          />

          <StatCard
            title="Inactive Coupons"
            value={inactiveCount}
            icon="○"
          />
        </div>

        {/* TABLE CARD */}
        <div
          style={{
            background: '#fffdf9',
            borderRadius: '18px',
            boxShadow:
              '0 8px 30px rgba(45, 51, 35, 0.08)',
            overflow: 'hidden',
          }}
        >
          {/* TOOLBAR */}
          <div
            style={{
              padding: '20px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              borderBottom: '1px solid #ece8de',
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: '1 1 280px',
              }}
            >
              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search coupon code..."
                style={inputStyle}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | 'ALL'
                    | 'ACTIVE'
                    | 'INACTIVE'
                )
              }
              style={{
                ...inputStyle,
                width: '180px',
              }}
            >
              <option value="ALL">
                All Coupons
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>

          {/* TABLE */}
          {loading ? (
            <div
              style={{
                padding: '70px 20px',
                textAlign: 'center',
                color: '#73786c',
              }}
            >
              Loading coupons...
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div
              style={{
                padding: '70px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '42px',
                  marginBottom: '10px',
                }}
              >
                🎟️
              </div>

              <h3
                style={{
                  color: '#303727',
                  marginBottom: '6px',
                }}
              >
                No coupons found
              </h3>

              <p
                style={{
                  color: '#858a7e',
                  margin: 0,
                }}
              >
                Create your first promotional coupon.
              </p>
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: '900px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f7f4ec',
                    }}
                  >
                    <th style={thStyle}>
                      Coupon
                    </th>

                    <th style={thStyle}>
                      Discount
                    </th>

                    <th style={thStyle}>
                      Minimum Order
                    </th>

                    <th style={thStyle}>
                      Validity
                    </th>

                    <th style={thStyle}>
                      Status
                    </th>

                    <th style={thStyle}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCoupons.map(
                    (coupon) => (
                      <tr key={coupon.id}>
                        <td style={tdStyle}>
                          <strong
                            style={{
                              color: '#313b25',
                              letterSpacing: '1px',
                            }}
                          >
                            {coupon.code}
                          </strong>

                          <div
                            style={{
                              fontSize: '12px',
                              color: '#929688',
                              marginTop: '4px',
                            }}
                          >
                            ID #{coupon.id}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <strong
                            style={{
                              color: '#667347',
                            }}
                          >
                            {formatDiscount(coupon)}
                          </strong>

                          <div
                            style={{
                              fontSize: '12px',
                              color: '#929688',
                              marginTop: '3px',
                            }}
                          >
                            {coupon.discount_type ===
                            'PERCENTAGE'
                              ? 'Percentage'
                              : 'Fixed amount'}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          {coupon.min_order_value !==
                          null
                            ? `₹${Number(
                                coupon.min_order_value
                              ).toLocaleString(
                                'en-IN'
                              )}`
                            : 'No minimum'}
                        </td>

                        <td style={tdStyle}>
                          <div>
                            {formatDate(
                              coupon.start_date
                            )}
                          </div>

                          <div
                            style={{
                              color: '#929688',
                              fontSize: '12px',
                              marginTop: '3px',
                            }}
                          >
                            to{' '}
                            {formatDate(
                              coupon.expiry_date
                            )}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              display:
                                'inline-flex',
                              alignItems:
                                'center',
                              gap: '6px',
                              padding:
                                '6px 10px',
                              borderRadius:
                                '20px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background:
                                coupon.status
                                  ? '#e7f2e2'
                                  : '#f3e9e7',
                              color:
                                coupon.status
                                  ? '#48713e'
                                  : '#985047',
                            }}
                          >
                            ●{' '}
                            {coupon.status
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              display:
                                'flex',
                              gap: '8px',
                            }}
                          >
                            <button
                              onClick={() =>
                                openEditModal(
                                  coupon
                                )
                              }
                              style={
                                actionButtonStyle
                              }
                            >
                              Edit
                            </button>

                            {coupon.status && (
                              <button
                                onClick={() =>
                                  deactivateCoupon(
                                    coupon
                                  )
                                }
                                style={{
                                  ...actionButtonStyle,
                                  color:
                                    '#a04d43',
                                  borderColor:
                                    '#e6c8c3',
                                }}
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(25, 30, 20, 0.55)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fffdf9',
              borderRadius: '20px',
              boxShadow:
                '0 25px 70px rgba(0,0,0,0.25)',
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: '22px 25px',
                borderBottom:
                  '1px solid #ece8de',
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: '#2e3824',
                    fontSize: '22px',
                  }}
                >
                  {editingCoupon
                    ? 'Edit Coupon'
                    : 'Create Coupon'}
                </h2>

                <p
                  style={{
                    margin: '5px 0 0',
                    color: '#8a8e83',
                    fontSize: '13px',
                  }}
                >
                  Configure your promotional offer.
                </p>
              </div>

              <button
                onClick={closeModal}
                style={{
                  border: 'none',
                  background: '#f1eee6',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: '25px',
              }}
            >
              {error && (
                <div
                  style={{
                    background: '#fff0ed',
                    color: '#9b3c32',
                    border:
                      '1px solid #f0c9c3',
                    padding: '12px',
                    borderRadius: '9px',
                    marginBottom: '18px',
                  }}
                >
                  ⚠ {error}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '17px',
                }}
              >
                <FormField
                  label="Coupon Code"
                  required
                >
                  <input
                    value={form.code}
                    onChange={(e) =>
                      updateField(
                        'code',
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="e.g. VIORA20"
                    style={inputStyle}
                    disabled={!!editingCoupon}
                  />
                </FormField>

                <FormField
                  label="Discount Type"
                  required
                >
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      updateField(
                        'discount_type',
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="PERCENTAGE">
                      Percentage
                    </option>

                    <option value="FIXED">
                      Fixed Amount
                    </option>
                  </select>
                </FormField>

                <FormField
                  label="Discount Value"
                  required
                >
                  <input
                    type="number"
                    min="0"
                    value={form.discount_value}
                    onChange={(e) =>
                      updateField(
                        'discount_value',
                        e.target.value
                      )
                    }
                    placeholder={
                      form.discount_type ===
                      'PERCENTAGE'
                        ? '10'
                        : '100'
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Minimum Order Value">
                  <input
                    type="number"
                    min="0"
                    value={form.min_order_value}
                    onChange={(e) =>
                      updateField(
                        'min_order_value',
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Maximum Discount">
                  <input
                    type="number"
                    min="0"
                    value={form.max_discount}
                    onChange={(e) =>
                      updateField(
                        'max_discount',
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Usage Limit">
                  <input
                    type="number"
                    min="1"
                    value={form.usage_limit}
                    onChange={(e) =>
                      updateField(
                        'usage_limit',
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="Per User Limit">
                  <input
                    type="number"
                    min="1"
                    value={form.per_user_limit}
                    onChange={(e) =>
                      updateField(
                        'per_user_limit',
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                    style={inputStyle}
                  />
                </FormField>

                <FormField
                  label="Start Date & Time"
                  required
                >
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) =>
                      updateField(
                        'start_date',
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField
                  label="Expiry Date & Time"
                  required
                >
                  <input
                    type="datetime-local"
                    value={form.expiry_date}
                    onChange={(e) =>
                      updateField(
                        'expiry_date',
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </FormField>
              </div>

              {/* ACTIONS */}
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: '10px',
                  marginTop: '27px',
                }}
              >
                <button
                  onClick={closeModal}
                  disabled={saving}
                  style={{
                    padding: '11px 18px',
                    borderRadius: '10px',
                    border:
                      '1px solid #ddd8cc',
                    background: '#fff',
                    color: '#555b4d',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={saveCoupon}
                  disabled={saving}
                  style={{
                    padding: '11px 21px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#68744d',
                    color: '#fff',
                    cursor: saving
                      ? 'not-allowed'
                      : 'pointer',
                    fontWeight: 700,
                    opacity: saving
                      ? 0.7
                      : 1,
                  }}
                >
                  {saving
                    ? 'Saving...'
                    : editingCoupon
                    ? 'Save Changes'
                    : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================
// STAT CARD
// =========================
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div
      style={{
        background: '#fffdf9',
        borderRadius: '16px',
        padding: '21px',
        boxShadow:
          '0 7px 25px rgba(45, 51, 35, 0.07)',
        border: '1px solid #eeeae0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              color: '#888d81',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            {title}
          </div>

          <div
            style={{
              color: '#2f3825',
              fontSize: '28px',
              fontWeight: 800,
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '13px',
            background: '#e9eddf',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#657147',
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// =========================
// FORM FIELD
// =========================
function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          color: '#454b3c',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '7px',
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color: '#a24d43',
            }}
          >
            {' '}
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

// =========================
// STYLES
// =========================
const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 13px',
  borderRadius: '9px',
  border: '1px solid #dcd8cd',
  background: '#fff',
  color: '#30372a',
  outline: 'none',
  fontSize: '14px',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '15px 18px',
  color: '#777d70',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle: React.CSSProperties = {
  padding: '17px 18px',
  borderTop: '1px solid #eeeae1',
  color: '#555b4f',
  fontSize: '14px',
};

const actionButtonStyle: React.CSSProperties = {
  border: '1px solid #d7ddca',
  background: '#f5f7ef',
  color: '#59643f',
  padding: '7px 11px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '12px',
};

export default CouponsPage;