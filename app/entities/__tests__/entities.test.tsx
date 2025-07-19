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

// Test wrapper with EntityProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <EntityProvider>
        {children}
    </EntityProvider>
)

// Helper function to render with wrapper
const renderWithProvider = (ui: React.ReactElement) => {
    return render(ui, { wrapper: TestWrapper })
}

// Mock fetch API
const mockFetch = jest.fn()
global.fetch = mockFetch as any

const mockEntitiesResponse = {
    success: true,
    data: [
        {
            id: '1',
            name: 'ABC Corporation Pty Ltd',
            abn: '12345678901',
            acn: '123456789',
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
            abn: '98765432109',
            acn: '987654321',
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
}

describe('Entities Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Mock successful fetch response by default
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockEntitiesResponse)
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
            renderWithProvider(<EntitiesPage />)
            // Check for loading state in main content area (not navbar)
            expect(screen.getAllByText(/loading/i)[1]).toBeInTheDocument()
        })

        it('calls fetch API on mount', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/entities?include=details')
            })
        })
    })

    describe('Data Display', () => {
        it('displays entities after successful fetch', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(screen.getAllByText("ABC Corporation Pty Ltd")[0]).toBeInTheDocument()
                expect(screen.getAllByText("XYZ Holdings Ltd")[0]).toBeInTheDocument()
            })
        })

        it('displays entity details correctly', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                // Check ABN/ACN display
                expect(screen.getByText('ABN: 12345678901')).toBeInTheDocument()
                expect(screen.getByText('ACN: 123456789')).toBeInTheDocument()

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
                // Check member counts - these appear as text content
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
                expect(screen.getAllByText("ABC Corporation Pty Ltd")[0]).toBeInTheDocument()
                expect(screen.getAllByText("XYZ Holdings Ltd")[0]).toBeInTheDocument()
            })

            // Perform search
            const searchInput = screen.getByPlaceholderText('Search entities...')
            fireEvent.change(searchInput, { target: { value: 'ABC' } })

            // Check filtered results
            expect(screen.getAllByText("ABC Corporation Pty Ltd")[0]).toBeInTheDocument()
            expect(screen.queryByText('XYZ Holdings Ltd')).not.toBeInTheDocument()
        })

        it('filters entities by ABN', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(screen.getAllByText("ABC Corporation Pty Ltd")[0]).toBeInTheDocument()
                expect(screen.getAllByText("XYZ Holdings Ltd")[0]).toBeInTheDocument()
            })

            const searchInput = screen.getByPlaceholderText('Search entities...')
            fireEvent.change(searchInput, { target: { value: '12345678901' } })

            expect(screen.getAllByText("ABC Corporation Pty Ltd")[0]).toBeInTheDocument()
            expect(screen.queryByText('XYZ Holdings Ltd')).not.toBeInTheDocument()
        })

        it('search is case insensitive', async () => {
            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(screen.getAllByText("ABC Corporation Pty Ltd")[0]).toBeInTheDocument()
            })

            const searchInput = screen.getByPlaceholderText('Search entities...')
            fireEvent.change(searchInput, { target: { value: 'abc corporation' } })

            expect(screen.getAllByText("ABC Corporation Pty Ltd")[0]).toBeInTheDocument()
            expect(screen.queryByText('XYZ Holdings Ltd')).not.toBeInTheDocument()
        })
    })

    describe('Error Handling', () => {
        it('handles fetch error gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
            mockFetch.mockRejectedValue(new Error('Network error'))

            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Error fetching entities:', expect.any(Error))
            })

            consoleSpy.mockRestore()
        })

        it('handles API error response gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Database connection failed'
                })
            })

            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch entities:', 'Database connection failed')
            })

            consoleSpy.mockRestore()
        })
    })

    describe('Empty State', () => {
        it('shows no entities message when empty', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: []
                })
            })

            renderWithProvider(<EntitiesPage />)

            await waitFor(() => {
                expect(screen.getByText(/no entities/i)).toBeInTheDocument()
            })
        })
    })
}) 