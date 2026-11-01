% Week 10 - Topic 4: Two-Dimensional Steady Diffusion (Laplace Equation)
% Lecture (Part 2):
%   * rectangle 0<x<W, 0<y<H: c = 0 on x=0, x=W, y=0; c = c0 on y=H
%       c/c0 = sum_{n odd} (4/(n pi)) sin(n pi x/W) sinh(n pi y/W)/sinh(n pi H/W)
%   * TEOS stagnant gas between two wafers (LPCVD furnace): cylindrical (r, z)
%       (1/r) d/dr(r dc/dr) + d^2c/dz^2 = 0
%       c = c_A0 at r = R (open edge), c = 0 at z = 0 (fast surface reaction on the wafer),
%       dc/dr = 0 at r = 0, dc/dz = 0 at z = L/2 (mid-plane symmetry)
%     deposition flux on the wafer N(r) = D dc/dz|_{z=0}: the edge receives more than the center.
%   * extension: finite surface rate D dc/dz = ks c at the wafer, Da = ks L/D.
%     For a thin gap (L << R) the gap-averaged balance gives a Bessel problem:
%       c = c_A0 I0(m r)/I0(m R),  m^2 = 2 ks/(D L),  Thiele modulus Phi = m R
%     centre/edge deposition ratio = 1/I0(Phi): uniform wafers need Phi < ~0.5
%     (reaction-limited LPCVD), which is why TEOS furnaces can stack wafers closely.
function week10_topic4_laplace_2d()
    fprintf('Rectangle W = H = 1, c/c0 at (x, y):\n');
    [cs, its] = rectSOR(40, 1.85, 1e-9);
    pts = [0.5 0.5; 0.25 0.75; 0.5 0.9; 0.1 0.5];
    for k = 1:4
        i = round(pts(k,1)*40) + 1; j = round(pts(k,2)*40) + 1;
        fprintf('  (%.2f,%.2f)  series = %.5f   SOR(40x40) = %.5f\n', pts(k,1), pts(k,2), rectSeries(pts(k,1), pts(k,2), 101), cs(j,i));
    end
    fprintf('  SOR iterations: %d    centre value exact = 0.25 by superposition\n', its);
    fprintf('  Gibbs: partial sums at (0.02, 1.0): [%.4f, %.4f, %.4f]\n', rectSeries(0.02,1,5), rectSeries(0.02,1,21), rectSeries(0.02,1,101));

    fprintf('\nTEOS wafer gap: R = 1, gap L = 0.1, Robin BC with Da = ks L/D\n');
    fprintf('  Thiele modulus Phi = R sqrt(2 Da)/L ; centre/edge deposition = 1/I0(Phi)\n');
    fprintf('  Da        Phi     FDM centre/edge   thin-gap 1/I0(Phi)   SOR its\n');
    for Da = [1e-4 1e-3 1e-2 5e-2]
        [c, k] = waferSOR(Da);
        Phi = sqrt(2*Da)/0.1;
        fprintf('  %7.1e  %6.3f   %.4f            %.4f             %d\n', Da, Phi, c(1,1), 1/besseli(0, Phi), k);
    end
    fprintf('  radial profile at Da = 1e-2 (Phi = 1.414):\n');
    c = waferSOR(1e-2); m = sqrt(2*1e-2)/0.1;
    for f = [0 0.25 0.5 0.75 1]
        fprintf('    r/R = %4.2f   FDM c_wafer = %.4f   thin-gap = %.4f\n', f, c(1, round(f*80)+1), besseli(0, m*f)/besseli(0, m));
    end
end

function s = rectSeries(x, y, nterms)
    s = 0;
    for n = 1:2:nterms
        a = n*pi;
        s = s + 4/(n*pi)*sin(a*x)*exp(a*(y - 1))*(1 - exp(-2*a*y))/(1 - exp(-2*a));
    end
end

function [c, it] = rectSOR(N, omega, tol)
    c = zeros(N+1); c(N+1, 2:N) = 1;
    for it = 1:20000
        err = 0;
        for j = 2:N
            for i = 2:N
                d = omega*(0.25*(c(j,i-1) + c(j,i+1) + c(j-1,i) + c(j+1,i)) - c(j,i));
                c(j,i) = c(j,i) + d; err = max(err, abs(d));
            end
        end
        if err < tol, return; end
    end
end

function [c, it] = waferSOR(Da)
    % rows j = 1..Nz+1 (z = 0..L/2), columns i = 1..Nr+1 (r = 0..R); wafer at row 1
    R = 1; L = 0.1; Nr = 80; Nz = 10; omega = 1.9; tol = 1e-10;
    dr = R/Nr; dz = (L/2)/Nz; ar = 1/dr^2; az = 1/dz^2; beta = 2*dz*Da/L;
    c = zeros(Nz+1, Nr+1); c(:, Nr+1) = 1;
    for it = 1:200000
        err = 0;
        for j = 2:Nz+1
            for i = 1:Nr
                if j < Nz+1, up = c(j+1,i); else, up = c(j-1,i); end
                dn = c(j-1,i);
                if i == 1
                    nw = (4*ar*c(j,2) + az*(up + dn))/(4*ar + 2*az);
                else
                    r = (i-1)*dr; w = (1 - dr/(2*r))*ar; e = (1 + dr/(2*r))*ar;
                    nw = (w*c(j,i-1) + e*c(j,i+1) + az*(up + dn))/(2*ar + 2*az);
                end
                d = omega*(nw - c(j,i)); c(j,i) = c(j,i) + d; err = max(err, abs(d));
            end
        end
        for i = 1:Nr
            nw = (4*c(2,i) - c(3,i))/(3 + beta); err = max(err, abs(nw - c(1,i))); c(1,i) = nw;
        end
        if err < tol, return; end
    end
end
