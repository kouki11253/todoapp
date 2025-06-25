import express, { Express, Request, Response } from 'express'; 
import methodOverride from 'method-override';
import path from 'path';
import { PrismaClient , Prisma} from '@prisma/client';

const prisma = new PrismaClient();

// Expressアプリケーションのセットアップ 
const app: Express = express();
const port = 3000;

// ミドルウェアの設定 
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
// __dirname は 'src' ディレクトリを指すため、ビューのパスを一つ上の階層に調整します
app.set('views', path.join(__dirname, '..', 'views'));


app.get('/', (req: Request, res: Response) => {
    res.redirect('/todos');
});

// ToDo一覧取得 & 検索
app.get('/todos', async (req: Request, res: Response) => {
    try {
        const {title,body,due_date_start,due_date_end,completed} = req.query;
        const where: Prisma.TodoWhereInput = {};
        if (typeof title === 'string' && title) {
            where.title = { contains: title };
        }
        if (typeof body === 'string' && body) {
            where.body = {contains: body };
        }
        const dateFilter: Prisma.DateTimeNullableFilter = {};
        let hasDateFilter = false;
        if (typeof due_date_start === 'string' && due_date_start) {
            dateFilter.gte = new Date(due_date_start);
            hasDateFilter = true;
        }
        if (typeof due_date_end === 'string' && due_date_end) {
            dateFilter.lte = new Date(due_date_end);
            hasDateFilter = true;
        }
        if (hasDateFilter) {
            where.due_date = dateFilter;
        }
        if (completed === 'true' || completed === 'false') {
            where.completed = completed === 'true';
        }
        
        const todos = await prisma.todo.findMany({
            where,
            orderBy: { created_at: 'desc' },
        });
        res.render('index', { todos, query: req.query });
    } catch (error) {
        console.error(error);
        res.status(500).send('サーバーエラーが発生しました');
    }
});

// 新規ToDo作成
app.post('/todos', async (req:Request, res:Response) => {
    try {
        const { title, body, due_date }: { title: string; body: string; due_date: string } = req.body;
        if (!title) {
             res.status(400).send('タイトルは必須です');
             return;
        }
        await prisma.todo.create({
            data:{
                title,
                body: body || null,
                due_date: due_date ? new Date(due_date) : null,
                completed: false,
            },
        });
        res.redirect('/todos');
    } catch (error) {
        console.error(error);
        res.status(500).send('サーバーエラーが発生しました');
    }
});

// ToDo編集画面表示
app.get('/todos/:id/edit', async(req:Request, res:Response) => {
    try {
        const {id} = req.params;
        const todo = await prisma.todo.findUnique({
            where: {id},
        });
        if (!todo) {
             res.status(404).send('指定されたtodoが見つかりません');
             return;
        }
        res.render('edit', { todo });
    } catch (error) {
        console.error(error);
        res.status(500).send('サーバーエラーが発生しました');
    }
});

// ToDo更新処理
app.patch('/todos/:id', async(req:Request, res:Response) => {
    try {
        const {id} = req.params;
        const { title, body, due_date }: { title: string; body: string; due_date: string } = req.body;
        const completed: boolean = req.body.completed === 'true';
        if (!title) {
             res.status(400).send('タイトルは必須です');
             return;
        }
        await prisma.todo.update({
            where:{id},
            data:{
                title,
                body: body || null,
                due_date: due_date ? new Date(due_date) : null,
                completed,
            },
        });
        const existingTodo = await prisma.todo.findUnique({
            where: {id},
        });
        if (!existingTodo) {
             res.status(404).send('該当のtodoが見つかりません');
             return;
        }
        res.redirect('/todos');
    } catch (error) {
        console.error(error);
        res.status(500).send('サーバーエラーが発生しました');
    }
});

// ToDo削除処理
app.delete('/todos/:id', async (req:Request, res:Response) => {
    try {
        const {id} = req.params;
        const existingTodo = await prisma.todo.findUnique({
            where: {id},
        });
        if (!existingTodo) {
             res.status(404).send('該当のToDoが見つかりません');
             return;
        }
        await prisma.todo.delete({
            where: {id},
        });
        res.redirect('/todos');
    } catch (error) {
        console.error(error);
        res.status(500).send('サーバーエラーが発生しました');
    }
});

// ToDo複製処理
app.post('/todos/:id/duplicate', async (req:Request, res:Response) => {
    try {
        const id:string = req.params.id;
        const originalTodo = await prisma.todo.findUnique({
            where: {id},
        });
        if (!originalTodo) {
             res.status(404).send('該当のToDoが見つかりません');
             return;
        }
        
        await prisma.todo.create({
            data:{
                title: `${originalTodo.title}のコピー`,
                body: originalTodo.body,
                completed: false,
                due_date:null,
            }
        });
        res.redirect('/todos');
    } catch (error) {
        console.error(error);
        res.status(500).send('サーバーエラーが発生しました');
    }
});

// --- サーバーの起動 ---
app.listen(port, () => {
    console.log(`ToDoアプリがポート${port}で起動しました`);
});
