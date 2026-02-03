/**
 * Tests for the connect HOC utility
 * Tests functionality, type inference, and error handling behavior
 */
import type { Component } from "solid-js";

import { describe, expect, it, vi } from "vitest";

import type { ConnectOptions, ErrorFallbackProps } from "@/utils/connect";
import { connect, connectWithProps } from "@/utils/connect";

describe("connect", () => {
	describe("connect()", () => {
		it("should create a connected component from UI and logic factory", () => {
			// Arrange
			interface TestLogic {
				message: string;
				count: number;
			}

			const createTestLogic = (): TestLogic => ({
				count: 42,
				message: "Hello from logic",
			});

			const TestUI: Component<TestLogic> = (_props) => null;

			// Act
			const TestComponent = connect(TestUI, createTestLogic);

			// Assert
			expect(TestComponent).toBeDefined();
			expect(typeof TestComponent).toBe("function");
		});

		it("should create logic factory that can be called", () => {
			// Arrange
			const logicFactory = vi.fn(() => ({
				value: "test",
			}));

			interface TestLogic {
				value: string;
			}

			const TestUI: Component<TestLogic> = (_props) => null;

			// Act
			const TestComponent = connect(TestUI, logicFactory);

			// Assert - the connected component should be created
			// (we can't invoke it without a DOM, but we verify the factory is accepted)
			expect(TestComponent).toBeDefined();
			expect(typeof TestComponent).toBe("function");
		});

		it("should set display name from UI component name", () => {
			// Arrange
			interface TestLogic {
				value: string;
			}

			const createLogic = (): TestLogic => ({ value: "test" });

			const MyNamedComponent: Component<TestLogic> = () => null;

			// Act
			const ConnectedComponent = connect(MyNamedComponent, createLogic);

			// Assert
			expect(ConnectedComponent.name).toBe("Connected(MyNamedComponent)");
		});

		it("should use custom display name when provided", () => {
			// Arrange
			interface TestLogic {
				value: string;
			}

			const createLogic = (): TestLogic => ({ value: "test" });
			const TestUI: Component<TestLogic> = () => null;

			// Act
			const ConnectedComponent = connect(TestUI, createLogic, {
				displayName: "CustomDisplayName",
			});

			// Assert
			expect(ConnectedComponent.name).toBe("CustomDisplayName");
		});

		it("should accept event handlers in logic factory", () => {
			// Arrange
			const handleClick = vi.fn();
			const handleChange = vi.fn();

			interface TestLogic {
				onClick: () => void;
				onChange: (value: string) => void;
			}

			const createTestLogic = (): TestLogic => ({
				onChange: handleChange,
				onClick: handleClick,
			});

			const TestUI: Component<TestLogic> = () => null;

			// Act
			const TestComponent = connect(TestUI, createTestLogic);

			// Assert - component should be created with handlers accepted
			expect(TestComponent).toBeDefined();
			expect(typeof TestComponent).toBe("function");
		});
	});

	describe("connectWithProps()", () => {
		it("should create a connected component that accepts external props", () => {
			// Arrange
			interface ExternalProps {
				initialValue: string;
			}

			interface TestLogic {
				displayValue: string;
			}

			const createTestLogic = (props: ExternalProps): TestLogic => ({
				displayValue: `Value: ${props.initialValue}`,
			});

			const TestUI: Component<TestLogic> = () => null;

			// Act
			const TestComponent = connectWithProps<TestLogic, ExternalProps>(TestUI, createTestLogic);

			// Assert
			expect(TestComponent).toBeDefined();
			expect(typeof TestComponent).toBe("function");
		});

		it("should pass external props type to logic factory", () => {
			// Arrange
			const logicFactory = vi.fn((props: { id: string }) => ({
				displayId: `ID: ${props.id}`,
			}));

			interface ExternalProps {
				id: string;
			}

			interface TestLogic {
				displayId: string;
			}

			const TestUI: Component<TestLogic> = () => null;

			// Act
			const TestComponent = connectWithProps<TestLogic, ExternalProps>(TestUI, logicFactory);

			// Assert - the connected component should accept external props
			expect(TestComponent).toBeDefined();
			expect(typeof TestComponent).toBe("function");
		});

		it("should set display name for connectWithProps", () => {
			// Arrange
			interface ExternalProps {
				value: string;
			}

			interface TestLogic {
				display: string;
			}

			const createLogic = (props: ExternalProps): TestLogic => ({ display: props.value });

			const MyPropsComponent: Component<TestLogic> = () => null;

			// Act
			const ConnectedComponent = connectWithProps<TestLogic, ExternalProps>(
				MyPropsComponent,
				createLogic
			);

			// Assert
			expect(ConnectedComponent.name).toBe("Connected(MyPropsComponent)");
		});

		it("should use custom display name when provided for connectWithProps", () => {
			// Arrange
			interface ExternalProps {
				value: string;
			}

			interface TestLogic {
				display: string;
			}

			const createLogic = (props: ExternalProps): TestLogic => ({ display: props.value });
			const TestUI: Component<TestLogic> = () => null;

			// Act
			const ConnectedComponent = connectWithProps<TestLogic, ExternalProps>(TestUI, createLogic, {
				displayName: "CustomPropsComponent",
			});

			// Assert
			expect(ConnectedComponent.name).toBe("CustomPropsComponent");
		});
	});

	describe("ConnectOptions", () => {
		it("should accept errorFallback option", () => {
			// Arrange
			interface TestLogic {
				value: string;
			}

			const createTestLogic = (): TestLogic => ({ value: "test" });
			const TestUI: Component<TestLogic> = () => null;

			const CustomFallback: Component<ErrorFallbackProps> = (_props) => null;

			// Act & Assert - should compile without errors
			const options: ConnectOptions<TestLogic> = {
				errorFallback: CustomFallback,
			};

			const TestComponent = connect(TestUI, createTestLogic, options);
			expect(TestComponent).toBeDefined();
		});

		it("should accept onError callback option", () => {
			// Arrange
			const onErrorSpy = vi.fn();

			interface TestLogic {
				items: string[];
				count: number;
			}

			const createTestLogic = (): TestLogic => ({
				count: 5,
				items: ["a", "b", "c"],
			});

			const TestUI: Component<TestLogic> = () => null;

			// Act & Assert - should compile without errors
			const options: ConnectOptions<TestLogic> = {
				onError: (error, logic) => {
					// TypeScript should know that logic has items and count
					onErrorSpy(error.message, logic.items.length, logic.count);
				},
			};

			const TestComponent = connect(TestUI, createTestLogic, options);
			expect(TestComponent).toBeDefined();
		});

		it("should accept displayName option", () => {
			// Arrange
			interface TestLogic {
				value: string;
			}

			const createTestLogic = (): TestLogic => ({ value: "test" });
			const TestUI: Component<TestLogic> = () => null;

			// Act
			const options: ConnectOptions<TestLogic> = {
				displayName: "MyCustomName",
			};

			const TestComponent = connect(TestUI, createTestLogic, options);

			// Assert
			expect(TestComponent.name).toBe("MyCustomName");
		});

		it("should accept all options together", () => {
			// Arrange
			interface TestLogic {
				data: string;
			}

			const createTestLogic = (): TestLogic => ({ data: "test" });
			const TestUI: Component<TestLogic> = () => null;
			const CustomFallback: Component<ErrorFallbackProps> = () => null;

			// Act & Assert - should compile without errors
			const options: ConnectOptions<TestLogic> = {
				displayName: "FullyConfigured",
				errorFallback: CustomFallback,
				onError: (error, logic) => {
					console.log(error.message, logic.data);
				},
			};

			const TestComponent = connect(TestUI, createTestLogic, options);
			expect(TestComponent.name).toBe("FullyConfigured");
		});
	});

	describe("type inference", () => {
		it("should enforce type safety between logic and UI props", () => {
			// This test verifies that TypeScript correctly infers types.
			// If this compiles without errors, the type inference is working.

			interface StrictLogic {
				count: number;
				name: string;
				onIncrement: () => void;
			}

			const createStrictLogic = (): StrictLogic => ({
				count: 0,
				name: "test",
				onIncrement: () => {},
			});

			// UI component must accept exactly the logic interface
			// TypeScript will error if props don't match StrictLogic
			const StrictUI: Component<StrictLogic> = (props) => {
				// Access props to verify they exist with correct types at compile time
				return props.count > 0 ? props.name : props.onIncrement.name;
			};

			// This should compile without errors
			const ConnectedStrict = connect(StrictUI, createStrictLogic);

			expect(ConnectedStrict).toBeDefined();
		});

		it("should enforce type safety for connectWithProps external props", () => {
			// This test verifies that external props are correctly typed

			interface ExternalProps {
				id: string;
				initialCount: number;
			}

			interface DerivedLogic {
				displayId: string;
				startingCount: number;
			}

			const createDerivedLogic = (props: ExternalProps): DerivedLogic => ({
				displayId: `ID: ${props.id}`,
				startingCount: props.initialCount,
			});

			// TypeScript will error if props don't match DerivedLogic
			const DerivedUI: Component<DerivedLogic> = (props) => {
				return `${props.displayId}: ${props.startingCount}`;
			};

			const ConnectedDerived = connectWithProps<DerivedLogic, ExternalProps>(
				DerivedUI,
				createDerivedLogic
			);

			// The returned component should accept ExternalProps
			expect(ConnectedDerived).toBeDefined();
		});

		it("should allow options type to match logic type in onError callback", () => {
			// Verify that ConnectOptions<TLogic> correctly types the onError callback

			interface TypedLogic {
				items: string[];
				selectedIndex: number;
			}

			const createTypedLogic = (): TypedLogic => ({
				items: ["a", "b", "c"],
				selectedIndex: 1,
			});

			const TypedUI: Component<TypedLogic> = () => null;

			// The onError callback should receive TypedLogic
			// TypeScript will error if logic doesn't have items/selectedIndex
			let capturedItems: string[] = [];
			let capturedIndex = 0;

			const options: ConnectOptions<TypedLogic> = {
				onError: (_error, logic) => {
					capturedItems = logic.items;
					capturedIndex = logic.selectedIndex;
				},
			};

			const Connected = connect(TypedUI, createTypedLogic, options);

			expect(Connected).toBeDefined();
			expect(options.onError).toBeDefined();
			// Verify captured vars are typed correctly
			expect(Array.isArray(capturedItems)).toBe(true);
			expect(typeof capturedIndex).toBe("number");
		});

		it("should correctly type complex nested logic structures", () => {
			// Test with more complex types

			interface NestedItem {
				id: string;
				data: {
					value: number;
					label: string;
				};
			}

			interface ComplexLogic {
				items: NestedItem[];
				selectedItem: NestedItem | null;
				onSelect: (item: NestedItem) => void;
				onClear: () => void;
			}

			const createComplexLogic = (): ComplexLogic => ({
				items: [{ data: { label: "Test", value: 1 }, id: "1" }],
				onClear: () => {},
				onSelect: () => {},
				selectedItem: null,
			});

			// TypeScript will error if props don't match ComplexLogic
			const ComplexUI: Component<ComplexLogic> = (props) => {
				// Access nested properties to verify type inference works
				const firstItem = props.items[0];
				const label = firstItem?.data.label ?? "none";
				const selected = props.selectedItem?.id ?? "none";
				props.onSelect({ data: { label: "test", value: 1 }, id: "new" });
				props.onClear();
				return `${label}-${selected}`;
			};

			const ConnectedComplex = connect(ComplexUI, createComplexLogic);

			expect(ConnectedComplex).toBeDefined();
		});
	});

	describe("logic factory behavior", () => {
		it("should allow logic factory to return computed values", () => {
			// Arrange
			const baseValue = 10;
			const multiplier = 5;

			interface ComputedLogic {
				baseValue: number;
				computedValue: number;
				formattedValue: string;
			}

			const createComputedLogic = (): ComputedLogic => ({
				baseValue,
				computedValue: baseValue * multiplier,
				formattedValue: `${baseValue} × ${multiplier} = ${baseValue * multiplier}`,
			});

			const TestUI: Component<ComputedLogic> = () => null;

			// Act
			const TestComponent = connect(TestUI, createComputedLogic);

			// Assert
			expect(TestComponent).toBeDefined();
		});

		it("should allow logic factory to capture closures", () => {
			// Arrange
			let counter = 0;

			interface ClosureLogic {
				increment: () => void;
				getCount: () => number;
			}

			const createClosureLogic = (): ClosureLogic => ({
				getCount: () => counter,
				increment: () => {
					counter++;
				},
			});

			const TestUI: Component<ClosureLogic> = () => null;

			// Act
			const TestComponent = connect(TestUI, createClosureLogic);

			// Assert - component should be created, closure logic accepted
			expect(TestComponent).toBeDefined();
			expect(typeof TestComponent).toBe("function");

			// Verify the logic factory works correctly when called directly
			const logic = createClosureLogic();
			expect(logic.getCount()).toBe(0);
			logic.increment();
			expect(logic.getCount()).toBe(1);
		});

		it("should support async handlers in logic", () => {
			// Arrange
			const mockFetch = vi.fn().mockResolvedValue({ data: "test" });

			interface AsyncLogic {
				onFetch: () => Promise<void>;
				onSave: (data: string) => Promise<boolean>;
			}

			const createAsyncLogic = (): AsyncLogic => ({
				onFetch: async () => {
					await mockFetch();
				},
				onSave: async (data: string) => {
					await mockFetch(data);
					return true;
				},
			});

			const TestUI: Component<AsyncLogic> = () => null;

			// Act
			const TestComponent = connect(TestUI, createAsyncLogic);

			// Assert
			expect(TestComponent).toBeDefined();
		});
	});
});
