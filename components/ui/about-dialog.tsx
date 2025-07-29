import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'
import { FaGithub } from "react-icons/fa";

interface AboutDialogProps {
    trigger?: React.ReactNode
    children?: React.ReactNode
}

export function AboutDialog({ trigger, children }: AboutDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" className="w-full justify-start">
                        <Info className="mr-2 h-4 w-4" />
                        About
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>About</DialogTitle>
                </DialogHeader>
                <h1 className="text-5xl font-medium text-center mb-0">secad</h1>
                <h4 className="text-center text-muted-foreground -mt-4">by Nick Schlobohm</h4>
                <div className="space-y-4">
                    <div className="space-y-2 text-center">
                        <p>Version 0.1.0</p>
                        <p>Licensed under the&nbsp;
                            <a
                                href="https://github.com/quelixir/secad/blob/main/LICENSE"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground underline"
                            >
                                AGPL-3.0
                            </a>
                        </p>
                    </div>
                    <div className="pt-4 flex justify-center">
                        <a
                            href="https://github.com/quelixir/secad"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FaGithub size={24} className="text-muted-foreground hover:text-foreground" />
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
} 