import { SNSvgGOptions, SNSvgTextOptions } from '@types';
export declare class SvgUtils {
    static createSvg(width: number, height: number): SVGSVGElement;
    static createG(options: SNSvgGOptions): SVGGElement;
    static createText(options: SNSvgTextOptions): SVGTextElement;
}
