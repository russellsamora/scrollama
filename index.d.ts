export = scrollama;
declare function scrollama(): scrollama.ScrollamaInstance;

declare namespace scrollama {

  export type DecimalType = 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;

  export type ScrollamaOptions = {
    step: NodeList | HTMLElement[] | string;
    progress?: boolean;
    offset?: DecimalType;
    threshold?: 1 | 2 | 3 | 4;
    order?: boolean;
    once?: boolean;
    debug?: boolean;
  };

  export type ProgressCallbackResponse = {
    element: HTMLElement;
    index: number;
    progress: DecimalType;
  };

  export type CallbackResponse = {
    element: HTMLElement;
    index: number;
    direction: "up" | "down";
  };

  export type StepCallback = (response: CallbackResponse) => void;
  export type StepProgressCallback = (
    response: ProgressCallbackResponse
  ) => void;

  export type ScrollamaInstance = {
    setup: (options: ScrollamaOptions) => ScrollamaInstance;
    onStepEnter: (callback: StepCallback) => ScrollamaInstance;
    onStepExit: (callback: StepCallback) => ScrollamaInstance;
    onStepProgress: (callback: StepProgressCallback) => ScrollamaInstance;
    resize: () => ScrollamaInstance;
    enable: () => ScrollamaInstance;
    disable: () => ScrollamaInstance;
    destroy: () => void;
    offsetTrigger: (value: [number, number]) => void;
  }
}
