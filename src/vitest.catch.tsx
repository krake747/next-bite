import { Component } from "react"

type CatchErrorProps = Readonly<{ onError: (error: unknown) => void; children: React.ReactElement }>

export class CatchError extends Component<CatchErrorProps, { failed: boolean }> {
    override state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    override componentDidCatch(error: unknown) {
        this.props.onError(error)
    }

    override render(): React.ReactElement | null {
        return this.state.failed ? null : this.props.children
    }
}
