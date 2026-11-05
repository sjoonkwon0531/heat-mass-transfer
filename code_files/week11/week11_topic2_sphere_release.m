% Week 11 - Topic 2: Transient Diffusion in a Sphere - Drug Release from a Gel Bead
% Lecture (Part 1):
%   dc/dt = D (d2c/dr2 + (2/r) dc/dr),  c(R,t) = cs = 0 (perfect sink),  dc/dr(0,t) = 0,  c(r,0) = c0
%   (c - c0)/(cs - c0) = 1 + (2R/(pi r)) sum_n (-1)^n/n sin(n pi r/R) exp(-n^2 pi^2 D t/R^2)
%   centre (r -> 0, sin x/x -> 1):  (c(0,t) - c0)/(cs - c0) = 1 + 2 sum_n (-1)^n exp(-n^2 pi^2 tau)
%   release rate   W(t) = 8 pi c0 D R sum_n exp(-n^2 pi^2 tau)
%   remaining      m(t)/m0 = (6/pi^2) sum_n (1/n^2) exp(-n^2 pi^2 tau),   tau = D t / R^2
%   long times (one term): m/m0 ~ (6/pi^2) exp(-pi^2 tau)  (the lecture writes ~ exp(-pi^2 tau))
%   short times: released fraction ~ 6 sqrt(tau/pi) - 3 tau  (semi-infinite limit with curvature)
% Run: week11_topic2_sphere_release   (MATLAB R2016b or later)

fprintf('=== 1. Series solution: centre concentration and remaining drug ===\n');
fprintf('  tau      c(0)/c0    m/m0 (series)   one-term (6/pi^2)e^(-pi^2 tau)\n');
for tau = [0.01 0.03 0.05 0.1 0.2 0.3]
    fprintf('  %5.2f    %.5f    %.5f        %.5f\n', tau, theta_s(0, tau), remaining(tau), 6/pi^2*exp(-pi^2*tau));
end

fprintf('\n=== 2. Check against a finite-volume solution (200 shells) ===\n');
for tau = [0.03 0.1]
    [cc, m] = finite_volume(tau, 200, 40000);
    fprintf('  tau = %4.2f: centre FV = %.4f vs series %.4f; m/m0 FV = %.4f vs series %.4f\n', ...
        tau, cc, theta_s(0.5/200, tau), m, remaining(tau));
end

fprintf('\n=== 3. Characteristic release times ===\n');
t50 = tau_for(0.5); t90 = tau_for(0.1);
fprintf('  50%% released at tau = %.4f;  90%% released at tau = %.4f\n', t50, t90);
fprintf('  short-time check: 6 sqrt(tau/pi) - 3 tau at tau_50 = %.4f (should be 0.5)\n', 6*sqrt(t50/pi) - 3*t50);

fprintf('\n=== 4. Case: release from hydrogel beads (illustrative diffusivities) ===\n');
names = {'small drug, D = 5e-10 m^2/s', 'protein, D = 1e-11 m^2/s'};
Ds = [5e-10 1e-11];
for k = 1:2
    fprintf('  %s\n', names{k});
    for Rmm = [0.1 0.5 1.0 2.0]
        R = Rmm*1e-3;
        fprintf('    R = %3.1f mm: t50 = %8.2f min, t90 = %8.1f min\n', Rmm, t50*R^2/Ds(k)/60, t90*R^2/Ds(k)/60);
    end
end
fprintf('  -> release time scales as R^2/D: halving the bead radius releases four times faster\n');

% ------------------------------------------------------------------ local functions
function f = remaining(tau)
    if tau <= 0, f = 1; return; end
    n = 1:400;
    f = 6/pi^2 * sum(exp(-(n*pi).^2*tau)./n.^2);
end

function s = theta_s(rho, tau)
    if tau <= 0, s = 1; return; end
    s = 0;
    for n = 1:400
        e = exp(-(n*pi)^2*tau);
        if e < 1e-300, break; end
        if rho < 1e-12, shape = n*pi; else, shape = sin(n*pi*rho)/rho; end
        s = s + 2*(-1)^(n+1)/(n*pi)*shape*e;
    end
end

function tau = tau_for(target)
    lo = 1e-8; hi = 5;
    for i = 1:200
        mid = sqrt(lo*hi);
        if remaining(mid) > target, lo = mid; else, hi = mid; end
    end
    tau = sqrt(lo*hi);
end

function [c0, m] = finite_volume(tauEnd, N, steps)
    dr = 1/N; dt = tauEnd/steps;
    i = 0:N-1;
    vol = ((i+1).^3 - i.^3)*dr^3/3;
    area = (i+1).^2*dr^2;
    c = ones(1, N);
    for s = 1:steps
        flux = zeros(1, N);
        flux(1:N-1) = -area(1:N-1).*(c(2:N) - c(1:N-1))/dr;
        flux(N) = -area(N)*(0 - c(N))/(0.5*dr);
        inflow = [0, flux(1:N-1)] - flux;
        c = c + dt*inflow./vol;
    end
    c0 = c(1);
    m = 3*sum(c.*vol);
end
