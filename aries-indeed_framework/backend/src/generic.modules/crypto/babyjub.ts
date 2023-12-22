import { F1Field, Scalar, utils } from "ffjavascript"


export class BabyJub {
    public p;
    public F;
    public Generator;
    public Base8;
    public order;
    public subOrder;
    public A;
    public D;

    constructor() {
        this.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
        this.F = new F1Field(this.p);

        this.Generator = [
            this.F.e("995203441582195749578291179787384436505546430278305826713579947235728471134"),
            this.F.e("5472060717959818805561601436314318772137091100104008585924551046643952123905")
        ];
        this.Base8 = [
            this.F.e("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
            this.F.e("16950150798460657717958625567821834550301663161624707787222815936182638968203")
        ];
        this.order = Scalar.fromString("21888242871839275222246405745257275088614511777268538073601725287587578984328");
        this.subOrder = Scalar.shiftRight(this.order, 3);
        this.A = this.F.e("168700");
        this.D = this.F.e("168696");
    }

    public addPoint(a, b) {

        const res = [];

        /* does the equivalent of:
         res[0] = bigInt((a[0]*b[1] + b[0]*a[1]) *  bigInt(bigInt("1") + d*a[0]*b[0]*a[1]*b[1]).inverse(q)).affine(q);
        res[1] = bigInt((a[1]*b[1] - cta*a[0]*b[0]) * bigInt(bigInt("1") - d*a[0]*b[0]*a[1]*b[1]).inverse(q)).affine(q);
        */

        const beta =this.F.mul(a[0], b[1]);
        const gamma =this.F.mul(a[1], b[0]);
        const delta =this.F.mul(
           this.F.sub(a[1],this.F.mul(this.A, a[0])),
           this.F.add(b[0], b[1])
        );
        const tau =this.F.mul(beta, gamma);
        const dtau =this.F.mul(this.D, tau);

        res[0] =this.F.div(
           this.F.add(beta, gamma),
           this.F.add(this.F.one, dtau)
        );

        res[1] =this.F.div(
           this.F.add(delta,this.F.sub(this.F.mul(this.A, beta), gamma)),
           this.F.sub(this.F.one, dtau)
        );

        return res;
    }

    public mulPointEscalar(base, e) {
        let res = [this.F.e("0"),this.F.e("1")];
        let rem = e;
        let exp = base;

        while (!Scalar.isZero(rem)) {
            if (Scalar.isOdd(rem)) {
                res = this.addPoint(res, exp);
            }
            exp = this.addPoint(exp, exp);
            rem = Scalar.shiftRight(rem, 1);
        }

        return res;
    }

    public inSubgroup(P) {
        if (!this.inCurve(P)) return false;
        const res = this.mulPointEscalar(P, this.subOrder);
        return (this.F.isZero(res[0]) &&this.F.eq(res[1],this.F.one));
    }

    public inCurve(P) {

        const x2 =this.F.square(P[0]);
        const y2 =this.F.square(P[1]);

        if (!this.F.eq(
           this.F.add(this.F.mul(this.A, x2), y2),
           this.F.add(this.F.one,this.F.mul(this.F.mul(x2, y2), this.D)))) return false;

        return true;
    }

    public packPoint(P) {
        const buff = utils.leInt2Buff(P[1], 32);
        if (this.F.lt(P[0],this.F.zero)) {
            buff[31] = buff[31] | 0x80;
        }
        return buff;
    }

    public unpackPoint(_buff) {
        const buff = Buffer.from(_buff);
        let sign = false;
        const P = new Array(2);
        if (buff[31] & 0x80) {
            sign = true;
            buff[31] = buff[31] & 0x7F;
        }
        P[1] = utils.leBuff2int(buff);
        if (Scalar.gt(P[1], this.p)) return null;

        const y2 =this.F.square(P[1]);

        let x =this.F.sqrt(this.F.div(
           this.F.sub(this.F.one, y2),
           this.F.sub(this.A,this.F.mul(this.D, y2))));

        if (x == null) return null;

        if (sign) x =this.F.neg(x);

        P[0] = x;

        return P;
    }
}