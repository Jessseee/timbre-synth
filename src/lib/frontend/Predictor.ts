import { type Descriptor, descriptorNames } from '$lib/frontend/Task';
import { paramNames, type Params } from '$lib/frontend/Synth';

/**
 * Result of sklearn.cross_decomposition.PLSRegression, fit on choix.opt_rankings result
 * of partial ranking annotations of random samples from normalized synth parameters.
 */
const inverseModel = {
	yMean: [0.05485249660416832, -0.021666672427154574, 0.010372896668691256],
	yScale: [0.9298574763401413, 1.0039052290615738, 0.9812612793369933],
	coef: [
		[0.22522799437651841, -0.005319011090649905, 0.09342851015276935],
		[-0.013594085903751238, -0.0037234240018691658, -0.0449191338222181],
		[-0.13412910157937424, -0.019626588535018065, 0.2809496677169817],
		[0.006652254025671085, 0.28171549122686335, -0.013461599646691812]
	],
	intercept: [0.5230498831185711, 0.5463690069625289, 0.5049176169535877, 0.5171357888312746]
};

const forwardModel = {
	yMean: [0.5230498831185711, 0.5463690069625289, 0.5049176169535877, 0.5171357888312746],
	yScale: [0.285892792441089, 0.2780148075127149, 0.3046203664816742, 0.30262524321576767],
	coef: [
		[0.8481909502440557, -0.09095431012508264, -0.24054299162878925, -0.034489449481087224],
		[-0.011394167557158563, -0.01834692451036132, 0.05172599730214825, 0.9083679352889212],
		[0.4772107949622923, -0.009714946431175393, 0.6849353060576584, 0.07644656330729356]
	],
	intercept: [0.05485249660416832, -0.021666672427154574, 0.010372896668691256]
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function dot(a: number[], b: number[]): number {
	if (a.length !== b.length) {
		throw new Error(`dot: length mismatch ${a.length} vs ${b.length}`);
	}
	let s = 0;
	for (let i = 0; i < a.length; i++) s += a[i] * b[i];
	return s;
}

function matVecMul(matrix: number[][], vector: number[]): number[] {
	return matrix.map((row) => dot(row, vector));
}

function standardize(x: number[], mean: number[], scale: number[]): number[] {
	if (x.length !== mean.length || x.length !== scale.length) {
		throw new Error("standardize: input, mean, and scale must have same length");
	}
	return x.map((v, i) => {
		const s = scale[i];
		if (s === 0) throw new Error(`standardize: scale[${i}] is 0`);
		return (v - mean[i]) / s;
	});
}
/**
 * Predict normalized synth params from descriptor scores.
 *
 * Input:
 * descriptor scores
 *
 * Output: normalized synth params
 */
export function predictParamsFromDescriptors(
	descriptors: Record<Descriptor, number>,
): Params {
	const input = descriptorNames.map((name) => descriptors[name]);
	const yStd = standardize(input, inverseModel.yMean, inverseModel.yScale);
	const linear = matVecMul(inverseModel.coef, yStd);
	if (linear.length !== inverseModel.intercept.length) {
		throw new Error("coef output size does not match intercept");
	}
	const predictions = linear.map((v, i) => v + inverseModel.intercept![i]);
	const params = {} as Params;
	predictions.forEach((x, j) => { params[paramNames[j]] = clamp01(x) });
	return params
}

/**
 * Predict descriptor scores from normalized synth parameters.
 *
 * Input:
 * normalized synth parameter
 *
 * Output: descriptor scores
 */
export function predictDescriptorsFromParams(
	params: Params,
): Record<Descriptor, number> {
	const input = paramNames.map((name) => params[name]);
	const yStd = standardize(input, forwardModel.yMean, forwardModel.yScale);
	const linear = matVecMul(forwardModel.coef, yStd);
	if (linear.length !== forwardModel.intercept.length) {
		throw new Error("coef output size does not match intercept");
	}
	const predictions = linear.map((v, i) => v + forwardModel.intercept![i]);
	const descriptors = {} as Record<Descriptor, number>;
	predictions.forEach((x, j) => { descriptors[descriptorNames[j]] = x });
	return descriptors
}