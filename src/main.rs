use sudokurust::board;
use sudokurust::solver::solve;

fn main() {
    // samplesディレクトリにある*.txtファイルを順に読み込む
    let paths = std::fs::read_dir("samples").unwrap();
    for path in paths {
        let path = path.unwrap().path();
        if path.extension().and_then(|s| s.to_str()) == Some("txt") {
            println!("Solving {:?}", path);
            let content = std::fs::read_to_string(&path).unwrap();
            let input: [Option<u8>; 81] = content
                .lines()
                .flat_map(|line| {
                    line.chars()
                        .map(|c| match c.to_digit(10) {
                            // あとの処理のために1-9を0-8に変換しておく
                            Some(n) if (1..=9).contains(&n) => Some(n as u8 - 1),
                            _ => None,
                        })
                        .collect::<Vec<Option<u8>>>()
                })
                .collect::<Vec<Option<u8>>>()
                .try_into()
                .unwrap();
            let board = board::Board::new(input);
            if let Some(solved_board) = solve(board) {
                println!("Solved board:\n{}", solved_board);
            } else {
                println!("No solution found for {:?}", path);
            }
        }
    }
}
