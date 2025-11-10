'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import CustomerCombobox from '@/components/CustomerCombobox';
import EmployeeMultiSelect from '@/components/EmployeeMultiSelect';
import EventQuantitiesEditor from '@/components/EventQuantitiesEditor';
import { getEmployees } from '@/employees';
import { formatLocal } from '@/lib/timezone';

type JobType = 'FENCE' | 'GUARDRAIL' | 'ATTENUATOR' | 'HANDRAIL' | 'TEMP_FENCE';
type Vendor = 'JORGE' | 'TONY' | 'CHRIS';
type WorkShift = 'DAY' | 'NIGHT';
type PaymentType = 'DAILY' | 'ADJUSTED';

type Checklist = {
  locate?: {
    ticket?: string;
    requested?: string;
    expires?: string;
    contacted?: boolean;
  };
  subtasks?: { id: string; text: string; done: boolean }[];
  employees?: string[];
};

type EventForm = {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
  invoice?: string;
  payment?: PaymentType;
  type?: JobType;
  vendor?: Vendor;
  payroll?: boolean;
  shift?: WorkShift;
  checklist?: Checklist | null;
  reminderEnabled: boolean;
  reminderOffsets: number[];
};

type Subtask = { id: string; text: string; done: boolean };

interface EditEventDialogProps {
  initial?: Partial<EventForm>;
  onSave: (data: EventForm) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onAdd?: () => Promise<void> | void;
  onDuplicate?: () => Promise<void> | void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  eventId?: string | null;
  isNewEvent?: boolean;
}

function defaultChecklist(): Checklist {
  return {
    locate: { ticket: '', requested: '', expires: '', contacted: false },
    subtasks: [],
    employees: [],
  };
}

function SubtasksEditor({
  value,
  onChange,
}: {
  value: Subtask[];
  onChange: (subs: Subtask[]) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const add = () => {
    const newSub: Subtask = { id: `tmp-${Date.now()}`, text: '', done: false };
    const updated = [...local, newSub];
    setLocal(updated);
    onChange(updated);
  };

  const update = (id: string, text: string) => {
    const updated = local.map(s => (s.id === id ? { ...s, text } : s));
    setLocal(updated);
    onChange(updated);
  };

  const remove = (id: string) => {
    const updated = local.filter(s => s.id !== id);
    setLocal(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {local.map(sub => (
        <div key={sub.id} className="flex gap-2 items-center">
          <Input
            value={sub.text}
            onChange={e => update(sub.id, e.target.value)}
            placeholder="Subtask description"
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(sub.id)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        + Add Subtask
      </Button>
    </div>
  );
}

export function EditEventDialog({
  initial,
  onSave,
  onDelete,
  onAdd,
  onDuplicate,
  trigger,
  open: controlledOpen,
  onOpenChange,
  eventId,
  isNewEvent = false,
}: EditEventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [form, setForm] = useState<EventForm>({
    title: '',
    start: '',
    end: '',
    allDay: false,
    location: '',
    description: '',
    invoice: '',
    payment: 'DAILY',
    type: 'FENCE',
  vendor: 'JORGE',
  payroll: false,
  shift: 'DAY',
  checklist: defaultChecklist(),
  reminderEnabled: false,
  reminderOffsets: [],
  ...initial,
});

  useEffect(() => {
    if (initial) {
      setForm(prev => ({
        ...prev,
        ...initial,
        checklist: initial.checklist ?? defaultChecklist(),
        reminderEnabled: initial.reminderEnabled ?? false,
        reminderOffsets: initial.reminderOffsets ?? [],
      }));
    }
  }, [initial]);

  const employees = getEmployees();

  const handleSave = async () => {
    await onSave(form);
    setOpen(false);
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
      setOpen(false);
    }
  };

  const handleAdd = async () => {
    if (onAdd) {
      await onAdd();
    }
  };

  const handleDuplicate = async () => {
    if (onDuplicate) {
      await onDuplicate();
    }
  };

  const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  const formatDateInput = (date: string, isAllDay: boolean) => {
    if (!date) return '';
    if (isAllDay) {
      return date.slice(0, 10);
    }
    const trimmed = date.trim();
    if (DATETIME_LOCAL_RE.test(trimmed)) {
      return trimmed;
    }
    try {
      return formatLocal(trimmed, "yyyy-MM-dd'T'HH:mm");
    } catch {
      return '';
    }
  };

  const parseDateInput = (value: string, isAllDay: boolean) => {
    if (!value) return '';
    if (isAllDay) {
      return value.slice(0, 10);
    }
    return value;
  };

  const startInputType = form.allDay ? 'date' : 'datetime-local';
  const endInputType = form.allDay ? 'date' : 'datetime-local';
  const startInputValue = formatDateInput(form.start, form.allDay);
  const endInputValue = formatDateInput(form.end || form.start, form.allDay);

  const handleStartChange = (value: string) => {
    const parsed = parseDateInput(value, form.allDay);
    setForm(prev => ({ ...prev, start: parsed }));
  };

  const handleEndChange = (value: string) => {
    const parsed = parseDateInput(value, form.allDay);
    setForm(prev => ({ ...prev, end: parsed }));
  };

  const handleAllDayToggle = (checked: boolean) => {
    setForm(prev => ({ ...prev, allDay: checked }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNewEvent ? 'Add Event' : 'Edit Event'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Event Info</TabsTrigger>
            <TabsTrigger value="work">Work & Payroll</TabsTrigger>
            <TabsTrigger value="tickets">Tickets & Subtasks</TabsTrigger>
            <TabsTrigger value="quantities">Quantities</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <CustomerCombobox
                value={form.title}
                onChange={value => setForm(prev => ({ ...prev, title: value }))}
                allowCreateOption
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start</Label>
                <Input
                  id="start"
                  type={startInputType}
                  value={startInputValue}
                  onChange={e => handleStartChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type={endInputType}
                  value={endInputValue}
                  onChange={e => handleEndChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="space-y-2">
                <Label>Work Time</Label>
                <SegmentedControl
                  options={[
                    { value: 'DAY', label: 'Day' },
                    { value: 'NIGHT', label: 'Night' },
                  ]}
                  value={form.shift || 'DAY'}
                  onChange={value =>
                    setForm(prev => ({ ...prev, shift: value as WorkShift }))
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="all-day"
                  checked={form.allDay}
                  onCheckedChange={handleAllDayToggle}
                />
                <Label htmlFor="all-day">
                  {form.allDay ? 'All-day event' : 'Timed event'}
                </Label>
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  value={form.type || 'FENCE'}
                  onChange={e =>
                    setForm(prev => ({ ...prev, type: e.target.value as JobType }))
                  }
                >
                  <option value="FENCE">Fence</option>
                  <option value="TEMP_FENCE">Temp Fence</option>
                  <option value="GUARDRAIL">Guardrail</option>
                  <option value="HANDRAIL">Handrail</option>
                  <option value="ATTENUATOR">Attenuator</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location || ''}
                  onChange={e =>
                    setForm(prev => ({ ...prev, location: e.target.value }))
                  }
                />
                {form.location && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        form.location || ''
                      )}`;
                      window.open(href, '_blank');
                    }}
                  >
                    Open in Google Maps
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice">Invoice #</Label>
                <Input
                  id="invoice"
                  value={form.invoice || ''}
                  onChange={e =>
                    setForm(prev => ({ ...prev, invoice: e.target.value }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="work" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Select
                  id="vendor"
                  value={form.vendor || 'JORGE'}
                  onChange={e =>
                    setForm(prev => ({ ...prev, vendor: e.target.value as Vendor }))
                  }
                >
                  <option value="JORGE">Jorge</option>
                  <option value="TONY">Tony</option>
                  <option value="CHRIS">Chris</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payroll">Payroll</Label>
                <Select
                  id="payroll"
                  value={form.payroll ? 'YES' : 'NO'}
                  onChange={e =>
                    setForm(prev => ({ ...prev, payroll: e.target.value === 'YES' }))
                  }
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment">Payment</Label>
                <Select
                  id="payment"
                  value={form.payment || 'DAILY'}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      payment: e.target.value as PaymentType,
                    }))
                  }
                >
                  <option value="DAILY">Daily</option>
                  <option value="ADJUSTED">Adjusted</option>
                </Select>
              </div>
            </div>

            <EmployeeMultiSelect
              label="Employees"
              employees={employees}
              value={form.checklist?.employees ?? []}
              onChange={sel =>
                setForm(prev => ({
                  ...prev,
                  checklist: {
                    ...(form.checklist ?? defaultChecklist()),
                    employees: sel,
                  },
                }))
              }
            />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.description || ''}
                onChange={e =>
                  setForm(prev => ({ ...prev, description: e.target.value }))
                }
                rows={4}
                placeholder="Additional notes..."
              />
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4 mt-4">
            <div className="rounded-lg border border-border p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket">Ticket #</Label>
                  <Input
                    id="ticket"
                    value={form.checklist?.locate?.ticket || ''}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        checklist: {
                          ...(form.checklist ?? defaultChecklist()),
                          locate: {
                            ...(form.checklist?.locate ?? {}),
                            ticket: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requested">Requested</Label>
                  <Input
                    id="requested"
                    type="date"
                    value={(form.checklist?.locate?.requested || '').slice(0, 10)}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        checklist: {
                          ...(form.checklist ?? defaultChecklist()),
                          locate: {
                            ...(form.checklist?.locate ?? {}),
                            requested: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires">Expires</Label>
                  <Input
                    id="expires"
                    type="date"
                    value={(form.checklist?.locate?.expires || '').slice(0, 10)}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        checklist: {
                          ...(form.checklist ?? defaultChecklist()),
                          locate: {
                            ...(form.checklist?.locate ?? {}),
                            expires: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subtasks</Label>
              <SubtasksEditor
                value={form.checklist?.subtasks ?? []}
                onChange={subs =>
                  setForm(prev => ({
                    ...prev,
                    checklist: {
                      ...(form.checklist ?? defaultChecklist()),
                      subtasks: subs,
                    },
                  }))
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="quantities" className="mt-4">
            {eventId ? (
              <EventQuantitiesEditor
                eventId={eventId}
                onHasQuantitiesChange={() => {}}
              />
            ) : (
              <p className="text-sm text-muted">
                Save the event to add quantities.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {onAdd && (
              <Button variant="outline" onClick={handleAdd}>
                Add
              </Button>
            )}
            {onDuplicate && (
              <Button variant="outline" onClick={handleDuplicate}>
                Duplicate
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="border border-[color-mix(in_srgb,var(--danger)_75%,#070808_25%)] bg-[color-mix(in_srgb,var(--danger)_88%,#090b0a_12%)] px-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:bg-[color-mix(in_srgb,var(--danger)_95%,#050607_5%)] focus-visible:ring-danger/45"
              >
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSave}
              className="border border-[#1f8f4f] bg-[linear-gradient(180deg,#2faa68,#1f7f47)] px-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_18px_rgba(8,40,18,0.35)] transition hover:bg-[linear-gradient(180deg,#32b971,#228f4f)] focus-visible:ring-accent/40"
            >
              Save Event
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
