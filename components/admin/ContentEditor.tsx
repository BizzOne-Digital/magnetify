"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { adminFetch } from "@/components/admin/adminFetch";
import type { FieldDef, PageDef } from "@/lib/contentSchema";

type Data = Record<string, unknown>;

function emptyItem(fields: FieldDef[]): Data {
  return Object.fromEntries(fields.map((f) => [f.name, f.type === "list" ? [] : ""]));
}

function Fields({ fields, data, onChange, prefix }: { fields: FieldDef[]; data: Data; onChange: (d: Data) => void; prefix: string }) {
  return (
    <div className="space-y-4">
      {fields.map((f) => {
        const id = `${prefix}-${f.name}`;
        const val = data[f.name];
        const update = (v: unknown) => onChange({ ...data, [f.name]: v });
        if (f.type === "image") {
          return <AdminImageField key={id} label={f.label} folder={f.folder} value={typeof val === "string" ? val : ""} onChange={update} />;
        }
        if (f.type === "list") {
          const list = Array.isArray(val) ? (val as Data[]) : [];
          return (
            <fieldset key={id} className="space-y-3 rounded-xl border border-gold/20 p-4">
              <legend className="px-1 font-display text-sm font-bold text-gold-light">{f.label}</legend>
              {list.map((item, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      {f.itemLabel} {i + 1}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" className="btn btn-ghost btn-sm px-2" disabled={i === 0} aria-label="Move up" onClick={() => { const n = [...list]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; update(n); }}>
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm px-2" disabled={i === list.length - 1} aria-label="Move down" onClick={() => { const n = [...list]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; update(n); }}>
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" className="btn btn-danger btn-sm px-2" aria-label={`Remove ${f.itemLabel} ${i + 1}`} onClick={() => update(list.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <Fields fields={f.fields} data={item} prefix={`${id}-${i}`} onChange={(d) => update(list.map((x, j) => (j === i ? d : x)))} />
                </div>
              ))}
              {!f.max || list.length < f.max ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => update([...list, emptyItem(f.fields)])}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add {f.itemLabel.toLowerCase()}
                </button>
              ) : null}
            </fieldset>
          );
        }
        return (
          <div key={id}>
            <label htmlFor={id} className="label">
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea id={id} rows={4} className="input" value={typeof val === "string" ? val : ""} onChange={(e) => update(e.target.value)} />
            ) : (
              <input id={id} className="input" value={typeof val === "string" ? val : ""} onChange={(e) => update(e.target.value)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ContentEditor({ def, initial }: { def: PageDef; initial: Data }) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const r = await adminFetch<{ data: Data }>(`/api/pages/${def.key}`, { method: "PUT", json: { data } });
      setData(r.data);
      toast.success(`${def.title} saved. The live site updates within a minute.`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!confirm(`Reset ${def.title} to the default content? Uploaded images used here will be deleted.`)) return;
    try {
      const r = await adminFetch<{ data: Data }>(`/api/pages/${def.key}`, { method: "DELETE" });
      setData(r.data);
      toast.success("Restored default content");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-dark p-5">
        <Fields fields={def.fields} data={data} onChange={setData} prefix={def.key} />
      </div>
      <div className="sticky bottom-0 flex gap-2 border-t border-gold/20 bg-[#0a0a0a]/95 py-4 backdrop-blur">
        <button type="button" className="btn btn-gold" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset to default
        </button>
      </div>
    </div>
  );
}
