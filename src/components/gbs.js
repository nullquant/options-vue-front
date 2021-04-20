export default class GBS {

    // Commodities
    static black_76(option_type, fs, x, t, r, v) {
        //Commodity option pricing.
    
        //The Black 76 model is for an option where the underlying commodity is traded
        //based on a future price rather than a spot price. Instead of dealing with a
        //spot price that drifts upwards at the risk free rate, this model deals with
        //a forward price that needs to be present valued.
    
        //Args:
        //    option_type (str): Type of the option. "p" for put and "c" for call options.
        //    fs (float): Price of underlying asset.
        //    x (float): Strike price.
        //    t (float): Time to expiration in years. 1 for one year, 0.5 for 6 months.
        //    r (float): Risk free rate.
        //    v (float): Implied volatility of underlying asset.
    
        //Returns:
        //    value (float): Price of the option.
        //    delta (float): First derivative of value with respect to price of underlying.
        //    gamma (float): Second derivative of value w.r.t price of underlying.
        //    theta (float): First derivative of value w.r.t. time to expiration.
        //    vega (float): First derivative of value w.r.t. implied volatility.
        //    rho (float): First derivative of value w.r.t. risk free rates.

        const b = 0;
        return GBS.gbs(option_type, fs, x, t, r, b, v);
    }

    static euro_implied_vol_76(option_type, fs, x, t, r, cp) {
        //Implied volatility calculator for European commodity options.

        //Args:
        //    option_type (str): Type of the option. "p" for put and "c" for call options.
        //    fs (float): Price of underlying asset.
        //    x (float): Strike price.
        //    t (float): Time to expiration in years. 1 for one year, 0.5 for 6 months.
        //    r (float): Risk free rate.
        //    cp (float): The price of the call or put observed in the market.

        //Returns:
        //    value (float): Implied volatility.

        const b = 0
        return GBS.gbs_implied_vol(option_type, fs, x, t, r, b, cp);
    }

    // ------------------------------------------------------------------------------------
    // The primary function for calculating Generalized Black Scholes option prices and deltas
    // Inputs: option_type = "p" or "c", fs = price of underlying, x = strike, t = time to expiration, r = risk free rate
    //         b = cost of carry, v = implied volatility
    // Outputs: value, delta, gamma, theta, vega, rho
    static gbs(option_type, fs, x, t, r, b, v) {

        GBS.gbs_test_input(option_type, fs, x, t, r, b, v)
    
        const t__sqrt = Math.sqrt(t);
        const d1 = (Math.log(fs / x) + (b + (v * v) / 2) * t) / (v * t__sqrt);
        const d2 = d1 - v * t__sqrt;
    
        var value, delta, gamma, theta, vega, rho;

        const cdf_d1 = GBS.normal_cdf(d1);
        const cdf_d2 = GBS.normal_cdf(d2);
        const pdf_d1 = GBS.normal_pdf(d1);

        var exp_br, exp_r;
        if (b - r === 0) exp_br = 1;
        else exp_br = Math.exp((b - r) * t);
        if (r == 0) exp_r = 1;
        else exp_r = Math.exp( -r * t);

        if (option_type === "c") {
            // it's a call
            value = fs * exp_br * cdf_d1 - x * exp_r * cdf_d2;
            delta = exp_br * cdf_d1;
            gamma = exp_br * pdf_d1 / (fs * v * t__sqrt);
            theta = -(fs * v * exp_br * pdf_d1) / (2 * t__sqrt) - (b - r) * fs * 
                    exp_br * cdf_d1 - r * x * exp_r * cdf_d2;
            vega = exp_br * fs * t__sqrt * pdf_d1;
            rho = x * t * exp_r * cdf_d2;
        } else {
            // it's a put
            value = x * exp_r * (1 - cdf_d2) - (fs * exp_br * (1 - cdf_d1));
            delta = -exp_br * (1 - cdf_d1);
            gamma = exp_br * pdf_d1 / (fs * v * t__sqrt);
            theta = -(fs * v * exp_br * pdf_d1) / (2 * t__sqrt) + (b - r) * fs * 
                    exp_br * (1 - cdf_d1) + r * x * exp_r * (1 - cdf_d2);
            vega = exp_br * fs * t__sqrt * pdf_d1;
            rho = -x * t * exp_r * (1 - cdf_d2);
        }
    
        return [value, delta, gamma, theta, vega, rho]
    }

    // Approximate Implied Volatility
    //
    // This function is used to choose a starting point for the
    // search functions (Newton and bisection searches).
    // Brenner & Subrahmanyam (1988), Feinstein (1988)
    static approx_implied_vol(option_type, fs, x, t, r, b, cp) {

        var ebrt, ert;
        if (b - r === 0) ebrt = 1;
        else ebrt = Math.exp((b - r) * t);
        if (r == 0) ert = 1;
        else ert = Math.exp( -r * t);

        const aa = Math.sqrt(2 * Math.PI) / (fs * ebrt + x * ert);

        var payoff;
    
        if (option_type === "c") payoff = fs * ebrt - x * ert;
        else payoff = x * ert - fs * ebrt;
    
        const bb = cp - payoff / 2;
        const cc = (payoff * payoff) / Math.PI;
    
        return  (aa * (bb + Math.sqrt(bb * bb + cc))) / Math.sqrt(t);
    }

    // Find the Implied Volatility of an European (GBS) Option given a price
    // using Newton-Raphson method for greater speed since Vega is available
    static gbs_implied_vol(option_type, fs, x, t, r, b, cp, precision=.0001, max_steps=10000) {
        return GBS.newton_implied_vol(GBS.gbs, option_type, x, fs, t, b, r, cp, precision, max_steps);
    }

    // Calculate Implied Volatility with a Newton Raphson search
    static newton_implied_vol(val_fn, option_type, x, fs, t, b, r, cp, precision=.0001, max_steps=10000) {

        // Estimate starting Vol, making sure it is allowable range
        let v = GBS.approx_implied_vol(option_type, fs, x, t, r, b, cp);
        v = Math.max(GBS.MIN_V, v);
        v = Math.min(GBS.MAX_V, v);
    
        // Calculate the value at the estimated vol

        let [value, delta, gamma, theta, vega, rho] = val_fn(option_type, fs, x, t, r, b, v);
        let min_diff = Math.abs(cp - value);
    
        // Newton-Raphson Search
        let countr = 0
        while (precision <= Math.abs(cp - value) <= min_diff && countr < max_steps) {
    
            v = v - (value - cp) / vega;
            if (v > GBS.MAX_V || v < GBS.MIN_V) break;
    
            [value, delta, gamma, theta, vega, rho] = val_fn(option_type, fs, x, t, r, b, v);
            min_diff = Math.min(Math.abs(cp - value), min_diff);
    
            // keep track of how many loops
            countr += 1;
        }

        // check if function converged and return a value
        if (Math.abs(cp - value) < precision) return v;
        else 
            // if the search function didn't converge, try a bisection search
            return GBS.bisection_implied_vol(val_fn, option_type, fs, x, t, r, b, cp, precision, max_steps);
    }

    // Find the Implied Volatility using a Bisection search
    static bisection_implied_vol(val_fn, option_type, fs, x, t, r, b, cp, precision=.0001, max_steps=10000) {
        // Estimate Upper and Lower bounds on volatility
        // Assume American Implied vol is within +/- 50% of the GBS Implied Vol
        var v_low, v_high, v_mid, cp_low, cp_high, cp_mid;

        v_mid = GBS.approx_implied_vol(option_type, fs, x, t, r, b, cp);
        if (v_mid <= GBS.MIN_V || v_mid >= GBS.MAX_V) {
            // if the volatility estimate is out of bounds, search entire allowed vol space
            v_low = GBS.MIN_V;
            v_high = GBS.MAX_V;
            v_mid = (v_low + v_high) / 2;
        } else {
            // reduce the size of the vol space
            v_low = Math.max(GBS.MIN_V, v_mid * .5);
            v_high = Math.min(GBS.MAX_V, v_mid * 1.5);
        }
        // Estimate the high/low bounds on price
        cp_mid = val_fn(option_type, fs, x, t, r, b, v_mid)[0];

        // initialize bisection loop
        let current_step = 0;
        let diff = Math.abs(cp - cp_mid);
    
        // Keep bisection volatility until correct price is found
        while (diff > precision && current_step < max_steps) {
            current_step += 1;
    
            // Cut the search area in half
            if (cp_mid < cp) v_low = v_mid;
            else v_high = v_mid;
    
            cp_low = val_fn(option_type, fs, x, t, r, b, v_low)[0];
            cp_high = val_fn(option_type, fs, x, t, r, b, v_high)[0];
    
            v_mid = v_low + (cp - cp_low) * (v_high - v_low) / (cp_high - cp_low);
            v_mid = Math.max(GBS.MIN_V, v_mid);  // enforce high/low bounds
            v_mid = Math.min(GBS.MAX_V, v_mid);  // enforce high/low bounds
    
            cp_mid = val_fn(option_type, fs, x, t, r, b, v_mid)[0];
            diff = Math.abs(cp - cp_mid);
        }

        // return output
        if (Math.abs(cp - cp_mid) < precision) return v_mid;
        else
            throw `Implied Vol did not converge. Best Guess=${v_mid}, Price diff=${diff}, Required Precision=${precision}`;
    }

    // An GBS model will return an error if an out-of-bound input is input
    static MAX32 = 2147483248.0;

    static MIN_T = 1.0 / 1000.0;  // requires some time left before expiration
    static MIN_X = 0.01;
    static MIN_FS = 0.01;

    // Volatility smaller than 0.5% causes American Options calculations
    // to fail (Number to large errors).
    // GBS() should be OK with any positive number. Since vols less
    // than 0.5% are expected to be extremely rare, and most likely bad inputs,
    // _gbs() is assigned this limit too
    static MIN_V = 0.005;

    static MAX_T = 100;
    static MAX_X = 2147483248.0;
    static MAX_FS = 2147483248.0;

    // Asian Option limits
    // maximum TA is time to expiration for the option
    static MIN_TA = 0;

    // This model will work with higher values for b, r, and V. However, such values are extremely uncommon.
    // To catch some common errors, interest rates and volatility is capped to 100%
    // This reason for 1 (100%) is mostly to cause the library to throw an exceptions
    // if a value like 15% is entered as 15 rather than 0.15)
    static MIN_b = -1;
    static MIN_r = -1;

    static MAX_b = 1;
    static MAX_r = 1;
    static MAX_V = 50;

    static gbs_test_input(option_type, fs, x, t, r, b, v) {
        if (option_type != "c" && option_type != "p")
            throw `Invalid Input option_type (${option_type}). Acceptable value are: c, p`;
        
        if (x < GBS.MIN_X || x > GBS.MAX_X)
            throw `Invalid Input Strike Price (${x})`;

        if (fs < GBS.MIN_FS || fs > GBS.MAX_FS)
            throw `Invalid Input Forward/Spot Price (${fs})`;

        if (t < GBS.MIN_T || t > GBS.MAX_T)
            throw `Invalid Input Time (T = ${t})`;

        if (b < GBS.MIN_b || b > GBS.MAX_b)
            throw `Invalid Input Cost of Carry (b = ${b})`;

        if (r < GBS.MIN_r || r > GBS.MAX_r)
            throw `Invalid Input Risk Free Rate (r = ${r})`;

        if (v < GBS.MIN_V || v > GBS.MAX_V)
            throw `Invalid Input Implied Volatility (V = ${v})`;
    }

    static normal_cdf(x) {
        var z = x/1.414213562;
        var t = 1/(1+0.3275911*Math.abs(z));
        var a1 =  0.254829592;
        var a2 = -0.284496736;
        var a3 =  1.421413741;
        var a4 = -1.453152027;
        var a5 =  1.061405429;
        var erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
        var sign = 1;
        if (z < 0) {
            sign = -1;
        }
        return 0.5*(1+sign*erf);
    }

    static normal_pdf(x) {
        return 0.3989422804 * Math.exp(- x * x * 0.5);
    }
}
