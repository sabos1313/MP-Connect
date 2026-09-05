import type { InputHTMLAttributes } from 'react';

export function Input({ label, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return <label className="field" htmlFor={id}><span>{label}</span><input id={id} {...props} /></label>;
}