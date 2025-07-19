'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { TransactionsTab } from './transactions-tab'

export default function TransactionsPage() {
    return (
        <MainLayout>
            <TransactionsTab />
        </MainLayout>
    )
} 