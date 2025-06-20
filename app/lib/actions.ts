'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { signIn } from 'next-auth/react';

// PostgreSQL connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Zod schema for invoices
const FormSchema = z.object({
  id: z.string().optional(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string().optional(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

/* ---------------- CREATE INVOICE ---------------- */
export async function createInvoice(
  prevState: State,
  formData: FormData
): Promise<State | void> {
  const validatedFields = FormSchema.omit({ id: true, date: true }).safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to create invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    console.error('DB Error (create):', error);
    return { message: 'Database error. Could not create invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

/* ---------------- UPDATE INVOICE ---------------- */
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
): Promise<State | void> {
  const validatedFields = FormSchema.omit({ id: true, date: true }).safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to update invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId},
          amount = ${amountInCents},
          status = ${status},
          date = ${date}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('DB Error (update):', error);
    return { message: 'Database error. Could not update invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

/* ---------------- DELETE INVOICE ---------------- */
export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Invoice deleted successfully.' };
  } catch (error) {
    console.error('DB Error (delete):', error);
    throw new Error('Database error. Failed to delete invoice.');
  }
}

/* ---------------- AUTHENTICATE USER ---------------- */
export async function authenticate(
  prevState: string | undefined,
  formData: FormData
): Promise<string | void> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    await signIn('credentials', {
      email,
      password,
      redirect: true,
      callbackUrl: '/dashboard',
    });
  } catch (error: any) {
    if (error.type === 'CredentialsSignin') {
      return 'Invalid credentials.';
    }
    return 'Something went wrong.';
  }
}
