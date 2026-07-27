import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { NotificationProvider, useNotifications } from "./NotificationContext";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

function TestConsumer() {
  const { notifications, unreadCount, addNotification, markRead, markAllRead, dismiss } =
    useNotifications();

  return (
    <div>
      <p data-testid="unread-count">{unreadCount}</p>
      <p data-testid="total-count">{notifications.length}</p>
      <button
        onClick={() =>
          addNotification({ id: "1", category: "risk", title: "Risk alert", message: "High volatility" })
        }
      >
        add
      </button>
      <button onClick={() => markRead("1")}>markRead</button>
      <button onClick={markAllRead}>markAllRead</button>
      <button onClick={() => dismiss("1")}>dismiss</button>
      {notifications.map((n) => (
        <p key={n.id} data-testid={`entry-${n.id}`}>
          {n.title}:{n.read ? "read" : "unread"}
        </p>
      ))}
    </div>
  );
}

function renderWithProvider() {
  return render(
    <NotificationProvider>
      <TestConsumer />
    </NotificationProvider>,
  );
}

describe("NotificationContext", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("throws when useNotifications is used outside a provider", () => {
    const OutsideConsumer = () => {
      useNotifications();
      return null;
    };
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<OutsideConsumer />)).toThrow(
      "useNotifications must be used within a NotificationProvider",
    );
    spy.mockRestore();
  });

  it("starts empty and adds a notification as unread", () => {
    renderWithProvider();
    expect(screen.getByTestId("total-count")).toHaveTextContent("0");

    act(() => screen.getByText("add").click());

    expect(screen.getByTestId("total-count")).toHaveTextContent("1");
    expect(screen.getByTestId("unread-count")).toHaveTextContent("1");
    expect(screen.getByTestId("entry-1")).toHaveTextContent("Risk alert:unread");
  });

  it("is idempotent when adding the same id twice", () => {
    renderWithProvider();
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("add").click());
    expect(screen.getByTestId("total-count")).toHaveTextContent("1");
  });

  it("marks a single notification read", () => {
    renderWithProvider();
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("markRead").click());
    expect(screen.getByTestId("unread-count")).toHaveTextContent("0");
    expect(screen.getByTestId("entry-1")).toHaveTextContent("Risk alert:read");
  });

  it("marks all notifications read", () => {
    renderWithProvider();
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("markAllRead").click());
    expect(screen.getByTestId("unread-count")).toHaveTextContent("0");
  });

  it("dismisses a notification, removing it entirely", () => {
    renderWithProvider();
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("dismiss").click());
    expect(screen.getByTestId("total-count")).toHaveTextContent("0");
  });

  it("persists notifications to localStorage across mounts", () => {
    const { unmount } = renderWithProvider();
    act(() => screen.getByText("add").click());
    unmount();

    renderWithProvider();
    expect(screen.getByTestId("total-count")).toHaveTextContent("1");
    expect(screen.getByTestId("entry-1")).toHaveTextContent("Risk alert:unread");
  });
});
