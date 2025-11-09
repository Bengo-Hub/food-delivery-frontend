import { render, screen } from "@testing-library/react";

import { Button } from "./button";

describe("Button", () => {
  it("renders primary variant by default", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-brand-emphasis");
  });

  it("supports asChild prop to render a link", () => {
    render(
      <Button asChild>
        <a href="/menu">Menu</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: /menu/i });
    expect(link).toBeInTheDocument();
  });
});
