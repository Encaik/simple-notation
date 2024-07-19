import { SNGOptions, SNTextOptions } from '@types';
export declare class SvgUtils {
    static createSvg(width: number, height: number): SVGSVGElement;
    static createG(options: SNGOptions): SVGGElement;
    static createText(options: SNTextOptions): SVGTextElement;
}
