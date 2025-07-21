'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Clock } from 'lucide-react';

export default function TestAuthPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading authentication status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Authentication Test</h1>

            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Authentication Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={user ? "default" : "destructive"}>
                            {user ? "Authenticated" : "Not Authenticated"}
                        </Badge>
                    </div>

                    {user && (
                        <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="text-sm font-medium">User Information:</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">ID:</span> {user.id}
                                </div>
                                <div>
                                    <span className="font-medium">Email:</span> {user.email}
                                </div>
                                {user.name && (
                                    <div>
                                        <span className="font-medium">Name:</span> {user.name}
                                    </div>
                                )}
                                {user.username && (
                                    <div>
                                        <span className="font-medium">Username:</span> {user.username}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 