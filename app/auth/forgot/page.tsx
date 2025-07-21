'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { MailQuestion } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);
        const form = e.currentTarget;
        const email = (form.email as HTMLInputElement).value;
        try {
            const redirectTo = `${window.location.origin}/auth/reset`;
            const result = await authClient.requestPasswordReset({ email, redirectTo });
            if (result.error) {
                setError(result.error.message || 'Failed to send reset link');
            } else {
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="flex flex-col items-center gap-2">
                    <MailQuestion className="h-8 w-8 text-primary" />
                    <CardTitle>Forgot Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" autoComplete="email" required disabled={loading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</Button>
                        {error && <div className="text-destructive text-sm text-center mt-2">{error}</div>}
                        {success && <div className="text-success text-sm text-center mt-2">Reset link sent! Check your email.</div>}
                    </form>
                    <div className="mt-4 text-center text-sm">
                        <Link href="/auth/signin" className="text-primary hover:underline">Back to sign in</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 