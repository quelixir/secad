import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EntityProvider } from '@/lib/entity-context'
import EntitiesPage from '../page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
    }),
    usePathname: () => '/entities',
}))

// Mock tRPC hooks
jest.mock('@/lib/hooks/use-trpc', () => ({
    useEntities: jest.fn(),
    useDeleteEntity: jest.fn(),
}))

const { useEntities, useDeleteEntity } = require('@/lib/hooks/use-trpc')

// Test wrapper with EntityProvider only
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <EntityProvider>
        {children}
    </EntityProvider>
)

// Helper function to render with wrapper
const renderWithProvider = (ui: React.ReactElement) => {
    return render(ui, { wrapper: TestWrapper })
}

const mockEntities = [
    {
        id: '1',
        name: 'ABC Corporation Pty Ltd',
        abn: '51824753556',
        acn: '123456780',
        entityType: 'Proprietary Company',
        status: 'Active',
        email: 'info@abccorp.com.au',
        phone: '+61 2 9000 0000',
        city: 'Sydney',
        state: 'NSW',
        createdAt: '2024-01-15T00:00:00.000Z',
        _count: {
            members: 5,
            securityClasses: 2,
            transactions: 10
        }
    },
    {
        id: '2',
        name: 'XYZ Holdings Ltd',
        abn: '98765432108',
        acn: '987654320',
        entityType: 'Public Company',
        status: 'Inactive',
        email: 'contact@xyzholdings.com.au',
        phone: '+61 3 8000 0000',
        city: 'Melbourne',
        state: 'VIC',
        createdAt: '2024-02-20T00:00:00.000Z',
        _count: {
            members: 3,
            securityClasses: 1,
            transactions: 5
        }
    }
]

describe('Entities Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Mock successful tRPC response by default
        useEntities.mockReturnValue({
            data: { success: true, data: mockEntities },
            isLoading: false,
            error: null,
            refetch: jest.fn()
        })

        useDeleteEntity.mockReturnValue({
            mutateAsync: jest.fn(),
            isLoading: false,
            error: null
        })
    })

    describe('Basic Rendering', () => {
        it('renders the entities page header', async () => {
            renderWithProvider(<EntitiesPage />)

            expect(screen.getByRole('heading', { name: 'Entities' })).toBeInTheDocument()
            expect(screen.getByText('Manage your corporate entities and their details')).toBeInTheDocument()
        })

        it('renders add entity button', async () => {
            renderWithProvider(<EntitiesPage />)

            const addButton = screen.getByRole('link', { name: /add entity/i })
            expect(addButton).toBeInTheDocument()
            expect(addButton).toHaveAttribute('href', '/entities/new')
        })

        it('shows loading state initially', () => {
            useEntities.mockReturnValue({
                data: null,
                isLoading: true,
                error: null,
                refetch: jest.fn()
            })

            renderWithProvider(<EntitiesPage />)
            expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0)
        })

        it('calls tRPC entities query on mount', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(useEntities).toHaveBeenCalled()
            })
        })
    })

    describe('Data Display', () => {
        it('displays entities after successful fetch', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                // There should be at least one occurrence in the table for each entity
                const abcRows = screen.getAllByText("ABC Corporation Pty Ltd")
                const xyzRows = screen.getAllByText("XYZ Holdings Ltd")
                expect(abcRows.length).toBeGreaterThan(0)
                expect(xyzRows.length).toBeGreaterThan(0)
            })
        })

        it('displays entity details correctly', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                // Check ABN/ACN display
                expect(screen.getByText('ABN: 51 824 753 556')).toBeInTheDocument()
                expect(screen.getByText('ACN: 123 456 780')).toBeInTheDocument()

                // Check entity types
                expect(screen.getByText('Proprietary Company')).toBeInTheDocument()
                expect(screen.getByText('Public Company')).toBeInTheDocument()
            })
        })

        it('displays status badges', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(screen.getByText('Active')).toBeInTheDocument()
                expect(screen.getByText('Inactive')).toBeInTheDocument()
            })
        })

        it('displays entity statistics', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                // Check member counts
                expect(screen.getByText('5')).toBeInTheDocument() // Members count for ABC Corp
                expect(screen.getByText('3')).toBeInTheDocument() // Members count for XYZ Holdings
            })
        })
    })

    describe('Search Functionality', () => {
        it('renders search input', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search entities...')).toBeInTheDocument()
            })
        })

        it('filters entities by name', async () => {
            renderWithProvider(<EntitiesPage />)

            // Wait for entities to load
            await waitFor(() => {
                expect(screen.getAllByText("ABC Corporation Pty Ltd").length).toBeGreaterThan(0)
                expect(screen.getAllByText("XYZ Holdings Ltd").length).toBeGreaterThan(0)
            })

            // Perform search
            const searchInput = screen.getByPlaceholderText('Search entities...')
            fireEvent.change(searchInput, { target: { value: 'ABC' } })

            // Check filtered results
            expect(screen.getAllByText("ABC Corporation Pty Ltd").length).toBeGreaterThan(0)
            expect(screen.queryByText('XYZ Holdings Ltd')).not.toBeInTheDocument()
        })

        it('filters entities by ABN', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(screen.getAllByText("ABC Corporation Pty Ltd").length).toBeGreaterThan(0)
                expect(screen.getAllByText("XYZ Holdings Ltd").length).toBeGreaterThan(0)
            })

            const searchInput = screen.getByPlaceholderText('Search entities...')
            fireEvent.change(searchInput, { target: { value: '51824753556' } })

            expect(screen.getAllByText("ABC Corporation Pty Ltd").length).toBeGreaterThan(0)
            expect(screen.queryByText('XYZ Holdings Ltd')).not.toBeInTheDocument()
        })

        it('search is case insensitive', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(screen.getAllByText("ABC Corporation Pty Ltd").length).toBeGreaterThan(0)
            })

            const searchInput = screen.getByPlaceholderText('Search entities...')
            fireEvent.change(searchInput, { target: { value: 'abc corporation' } })

            expect(screen.getAllByText("ABC Corporation Pty Ltd").length).toBeGreaterThan(0)
            expect(screen.queryByText('XYZ Holdings Ltd')).not.toBeInTheDocument()
        })
    })

    describe('Error Handling', () => {
        it('handles tRPC error gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

            useEntities.mockReturnValue({
                data: null,
                isLoading: false,
                error: new Error('Network error'),
                refetch: jest.fn()
            })

            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching entities:', expect.any(Error))
            })

            consoleSpy.mockRestore()
        })

        it('handles tRPC error response gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

            useEntities.mockReturnValue({
                data: { success: false, error: 'Database connection failed' },
                isLoading: false,
                error: null,
                refetch: jest.fn()
            })

            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching entities:', expect.anything())
            })

            consoleSpy.mockRestore()
        })
    })

    describe('Empty State', () => {
        it('shows no entities message when empty', async () => {
            useEntities.mockReturnValue({
                data: { success: true, data: [] },
                isLoading: false,
                error: null,
                refetch: jest.fn()
            })

            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(screen.getByText(/no entities/i)).toBeInTheDocument()
            })
        })
    })
}) 