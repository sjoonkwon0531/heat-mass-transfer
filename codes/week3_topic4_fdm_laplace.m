% Week 3 - Topic 4: Numerical Solution of the 2D Laplace Equation by FDM
% 5-point stencil: T(i+1,j) + T(i-1,j) + T(i,j+1) + T(i,j-1) - 4*T(i,j) = 0
% Part 1: classic 4x4 heated plate (top=100, left=75, right=50, bottom=0),
%         solved directly as a 9x9 linear system (as in the lecture matrix).
% Part 2: Gauss-Seidel (Liebmann) iteration on a 40x40 unit square, top = 1.

function week3_topic4_fdm_laplace
    close all; clc
    % --- Part 1: direct linear-system solve (lecture 9x9 matrix) ---
    A = 4*eye(9);
    for r = 1:9
        i = mod(r-1, 3) + 1;  j = floor((r-1)/3) + 1;   % (i,j) in 1..3
        if i < 3, A(r, r+1) = -1; end
        if i > 1, A(r, r-1) = -1; end
        if j < 3, A(r, r+3) = -1; end
        if j > 1, A(r, r-3) = -1; end
    end
    b = [75; 0; 50; 75; 0; 50; 175; 100; 150];
    T = A \ b;
    fprintf('Part 1: interior temperatures (direct solve)\n');
    for j = 3:-1:1
        fprintf('  T(1,%d)=%7.3f  T(2,%d)=%7.3f  T(3,%d)=%7.3f\n', ...
                j, T(3*j-2), j, T(3*j-1), j, T(3*j));
    end

    % --- Part 2: Gauss-Seidel on a fine grid (lecture demo) ---
    n = 40; w = 1; h = 1;
    x = linspace(0, w, n); y = linspace(0, h, n);
    T2 = zeros(n);
    T2(1,1:n) = 1;   % Top
    T2(n,1:n) = 0;   % Bottom
    T2(1:n,1) = 0;   % Left
    T2(1:n,n) = 0;   % Right

    tol = 1e-6; err = 1; k = 0;
    while err > tol
        k = k + 1;
        Told = T2;
        for i = 2:n-1
            for j = 2:n-1
                T2(i,j) = 0.25 * (T2(i,j-1) + T2(i-1,j) + T2(i+1,j) + T2(i,j+1));
            end
        end
        err = max(max(abs(Told - T2)));
    end
    fprintf('\nPart 2: %dx%d grid converged in %d iterations\n', n, n, k);
    fprintf('  T at center = %.6f\n', T2(round(n/2), round(n/2)));

    subplot(3,1,1), contour(x, y, T2, 'showtext', 'on'), colormap
    title('Normalized temperature (Steady State)'), xlabel('x/L'), ylabel('y/L'), colorbar
    subplot(3,1,2), pcolor(x, y, T2), shading interp
    title('Normalized temperature (Steady State)'), xlabel('x/L'), ylabel('y/L'), colorbar
    subplot(3,1,3)
    surf(T2'); xlabel('x'); ylabel('y'); zlabel('Normalized Temp.'); colorbar
end
