'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

function ResetPasswordForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams?.get('token');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);
        const form = e.currentTarget;
        const password = (form.password as HTMLInputElement).value;
        const confirmPassword = (form.confirmPassword as HTMLInputElement).value;
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        if (!token) {
            setError('Missing or invalid reset token');
            setLoading(false);
            return;
        }
        try {
            const result = await authClient.resetPassword({ newPassword: password, token });
            if (result.error) {
                setError(result.error.message || 'Failed to reset password');
            } else {
                setSuccess(true);
                setTimeout(() => router.push('/auth/signin'), 2000);
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
                    <KeyRound className="h-8 w-8 text-primary" />
                    <CardTitle>Reset Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" name="password" type="password" autoComplete="new-password" required disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required disabled={loading} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
                        {error && <div className="text-destructive text-sm text-center mt-2">{error}</div>}
                        {success && <div className="text-success text-sm text-center mt-2">Password reset! Redirecting to sign in...</div>}
                    </form>
                    <div className="mt-4 text-center text-sm">
                        <Link href="/auth/signin" className="text-primary hover:underline">Back to sign in</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-muted">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="flex flex-col items-center gap-2">
                        <KeyRound className="h-8 w-8 text-primary" />
                        <CardTitle>Reset Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">Loading...</div>
                    </CardContent>
                </Card>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
} 