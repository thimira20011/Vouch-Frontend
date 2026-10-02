import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean };

export default function Button({ children, secondary = false, className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`button ${secondary ? 'button-secondary' : 'button-primary'} ${className}`} {...props}>{children}</button>;
}
