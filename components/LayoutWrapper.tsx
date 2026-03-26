import Navigation from '@/components/Navigation'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <body>
                <Navigation />
                {children}
            </body>
        </html>
    )
}
