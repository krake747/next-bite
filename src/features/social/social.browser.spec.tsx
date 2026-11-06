import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AvatarGroup } from "@pattern/avatar-group"

import { ActivityPost } from "./activity-post"
import { CommentList } from "./comment-list"
import { FriendPresence } from "./friend-presence"
import { PhotoGallery } from "./photo-gallery"
import { ReactionBar } from "./reaction-bar"
import { SocialMetadata } from "./social-metadata"

const friends = [
    { name: "Alex" },
    { name: "Priya" },
    { name: "Jamie" },
    { name: "Leo" },
    { name: "Mara" },
    { name: "Noor" },
]

describe("AvatarGroup", () => {
    it("shows at most four members with an overflow indicator", () => {
        render(<AvatarGroup members={friends} />)
        expect(screen.getByText("+2")).toBeInTheDocument()
        expect(screen.getByRole("group", { name: /Alex.*2 more/ })).toBeInTheDocument()
    })

    it("renders members that share a name", () => {
        render(<AvatarGroup members={[{ name: "Alex" }, { name: "Alex" }]} />)
        expect(screen.getAllByLabelText("Alex")).toHaveLength(2)
    })
})

describe("FriendPresence", () => {
    it("announces active and away states to assistive technology", () => {
        const { rerender } = render(<FriendPresence active />)
        expect(screen.getByText("Active now")).toBeInTheDocument()
        rerender(<FriendPresence active={false} />)
        expect(screen.getByText("Away")).toBeInTheDocument()
    })
})

describe("SocialMetadata", () => {
    it("speaks in human language, not database terms", () => {
        render(<SocialMetadata ownerName="Alex" wantCount={4} beenCount={1} />)
        expect(screen.getByText("Added by Alex")).toBeInTheDocument()
        expect(screen.getByText("4 friends want to try")).toBeInTheDocument()
        expect(screen.getByText("Visited by a friend")).toBeInTheDocument()
    })

    it("renders nothing without social context", () => {
        const { container } = render(<SocialMetadata />)
        expect(container).toBeEmptyDOMElement()
    })
})

describe("ReactionBar", () => {
    it("toggles like and want through callbacks", async () => {
        const user = userEvent.setup()
        const onToggleLike = vi.fn<() => void>()
        const onToggleWant = vi.fn<() => void>()
        const onComment = vi.fn<() => void>()
        render(
            <ReactionBar
                reactions={{
                    liked: false,
                    likeCount: 3,
                    onToggleLike,
                    commentCount: 1,
                    onComment,
                    wanted: false,
                    wantCount: 4,
                    onToggleWant,
                }}
            />,
        )
        await user.click(screen.getByRole("button", { name: /Like/ }))
        await user.click(screen.getByRole("button", { name: /Want to try/ }))
        await user.click(screen.getByRole("button", { name: /Comments/ }))
        expect(onToggleLike).toHaveBeenCalledTimes(1)
        expect(onToggleWant).toHaveBeenCalledTimes(1)
        expect(onComment).toHaveBeenCalledTimes(1)
    })
})

describe("CommentList", () => {
    const comments = [
        { id: "c1", author: "Alex", text: "The pasta is unreal.", time: "2h ago" },
        { id: "c2", author: "Priya", text: "Going Friday!", time: "1h ago" },
    ]

    it("adds a comment and lets authors delete their own", async () => {
        const user = userEvent.setup()
        const onAdd = vi.fn<(text: string) => void>()
        const onDelete = vi.fn<(id: string) => void>()
        render(<CommentList comments={comments} currentUser="Alex" onAdd={onAdd} onDelete={onDelete} />)
        expect(screen.getByText("2 comments")).toBeInTheDocument()

        await user.type(screen.getByLabelText("Write a comment"), "Count me in")
        await user.click(screen.getByRole("button", { name: "Post" }))
        expect(onAdd).toHaveBeenCalledWith("Count me in")

        await user.click(screen.getByRole("button", { name: "Delete comment by Alex" }))
        expect(onDelete).toHaveBeenCalledWith("c1")
        expect(screen.queryByRole("button", { name: "Delete comment by Priya" })).not.toBeInTheDocument()
    })
})

describe("PhotoGallery", () => {
    const photos = [{ url: "https://example.com/1.jpg", author: "Alex" }, { url: "https://example.com/2.jpg" }]

    it("attributes photos and opens the viewer", async () => {
        const user = userEvent.setup()
        render(<PhotoGallery photos={photos} />)
        expect(screen.getByText("Alex")).toBeInTheDocument()

        await user.click(screen.getByRole("button", { name: /Open photo 1/ }))
        expect(screen.getByText("Image Gallery (1/2)")).toBeInTheDocument()
    })
})

describe("ActivityPost", () => {
    it("reads like a friend's discovery, not a database entry", () => {
        render(
            <ActivityPost
                author={{ name: "Alex" }}
                time="2 hours ago"
                text="You have to try this place."
                restaurant={{ name: "Trattoria Verde", cuisine: "Italian" }}
                social={{ ownerName: "Alex", wantCount: 4, interestedNames: friends.slice(0, 2).map((f) => f.name) }}
                reactions={{
                    liked: false,
                    likeCount: 3,
                    onToggleLike: () => {},
                    commentCount: 2,
                    onComment: () => {},
                    wanted: true,
                    wantCount: 4,
                    onToggleWant: () => {},
                }}
            />,
        )
        expect(screen.getByText("Alex")).toBeInTheDocument()
        expect(screen.getByText("You have to try this place.")).toBeInTheDocument()
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.getByText("Added by Alex")).toBeInTheDocument()
        expect(screen.getByText("4 friends want to try")).toBeInTheDocument()
    })
})
