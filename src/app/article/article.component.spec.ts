import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { ArticleComponent } from "./article.component";
import { ActivatedRoute, Router } from "@angular/router";
import { Article, ArticlesService, CommentsService, Profile, User, UserService, Comment } from "../core";
import { of, throwError } from "rxjs";
import { ArticleMetaComponent, FavoriteButtonComponent, FollowButtonComponent } from "../shared";
import { MarkdownPipe } from "./markdown.pipe";
import { RouterTestingModule } from '@angular/router/testing';
import { Component, DebugElement, Directive } from "@angular/core";
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ArticleCommentComponent } from "./article-comment.component";

const user: User = {
  email: 'abc.com',
  token: '123',
  username: 'areeba',
  bio: 'software engineer',
  image: 'path/1233'
}

const profile: Profile = {
  username: 'areeba',
  bio: 'software engineer',
  image: 'path/123',
  following: false
}

const article: Article = {
  slug: 'test',
  title: 'Ikigai',
  description: 'This is an article',
  body: 'This is the body of article',
  tagList: ['tag1', 'tag2'],
  createdAt: '6/15/15, 9:03 AM',
  updatedAt: '6/15/15, 9:03 AM',
  favorited: true,
  favoritesCount: 3,
  author: profile
};

const comments: Comment[] = [
  {
    id: 1,
    body: 'Comment no 1',
    createdAt: '6/15/2023',
    author: profile
  },
  {
    id: 2,
    body: 'Comment no 2',
    createdAt: '6/15/2023',
    author: profile
  }
];

describe("ArticleComponent", () => {
  let commentService: CommentsService;
  let component: ArticleComponent;
  let fixture: ComponentFixture<ArticleComponent>;
  let mockArticleService: jasmine.SpyObj<ArticlesService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  const route = ({ data: of({ 'article': article }) } as any) as ActivatedRoute;
  let router: Router;

  beforeEach(async () => {

    mockUserService = jasmine.createSpyObj('UserService', ['currentUser']);
    mockArticleService = jasmine.createSpyObj('ArticlesService', ['destroy']);

    await TestBed.configureTestingModule({
      declarations: [
        ArticleComponent,
        ArticleMetaComponent,
        FollowButtonComponent,
        FavoriteButtonComponent,
        MarkdownPipe,
        ArticleCommentComponent,
        MockDirective({
          selector: '[appShowAuthed]',
          inputs: ['appShowAuthed']
        })
      ],
      providers: [
        // Set up the mock services for the test
        {
          provide: ActivatedRoute,
          useValue: route
        },
        {
          provide: ArticlesService,
          useValue: mockArticleService
        },
        {
          provide: CommentsService,
          userValue: commentService
        },
        {
          provide: UserService,
          useValue: mockUserService
        },
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    router = TestBed.get(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
    const spy = TestBed.get(UserService);
    spy.currentUser = of(user);
    commentService = TestBed.inject(CommentsService);
    fixture.detectChanges();
  });

  it('should create component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should test ngOnInit and check populateComments is called', () => {
    const spy = spyOn(component, 'populateComments').and.callThrough();
    component.ngOnInit();
    fixture.detectChanges();
    expect(spy).toBeDefined();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should test onToggleFavorite with favorite as true and check the incremented value is correct ', () => {
    component.article.favoritesCount = 3;
    component.onToggleFavorite(true);
    fixture.detectChanges();
    expect(component.article.favoritesCount).toBe(4);
  });

  it('should test onToggleFavorite with favorite as false and check the deccremented value is correct ', () => {
    component.article.favoritesCount = 3;
    component.onToggleFavorite(false);
    fixture.detectChanges();
    expect(component.article.favoritesCount).toBe(2);
  });

  it('should test onToggleFollowing with following as true and check article has correct value for following', () => {
    component.onToggleFollowing(true);
    const following = component.article.author.following;
    expect(following).toBeTrue();
  });

  it('should test onToggleFollowing with following as true and check article has correct value for following', () => {
    component.onToggleFollowing(false);
    const following = component.article.author.following;
    expect(following).toBeFalse();
  });

  it('should test deleteArticle and check the navigate method has been called', () => {
    mockArticleService.destroy.and.returnValue(of('article deleted'));
    component.deleteArticle();
    fixture.detectChanges();
    expect(mockArticleService.destroy).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('should test deleteComment and check the navigate method has been called', fakeAsync(() => {
    component.comments = comments;
    const spy = spyOn(commentService, 'destroy').and.returnValue(of(comments));
    component.onDeleteComment(comments[0]);
    tick();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  }));

  it('should test addComment and check the add method of service is called', () => {
    component.comments = comments;
    const spy = spyOn(commentService, 'add').and.returnValue(of(comments[0]))
    component.addComment();
    expect(component.isSubmitting).toBeFalse();
    expect(spy).toHaveBeenCalled();
  });

  it('should test addComment and check the service returns error', () => {
    component.comments = comments;
    const errorResponse = new Error('httpService.post error');
    spyOn(commentService, 'add').and.returnValue(throwError(errorResponse));
    component.addComment();
    expect(component.isSubmitting).toBeFalse();
    expect(component.commentFormErrors).not.toBeNull();
  });

  it('should test populateComments and check getAll method of comment service is called', () => {
    const spy = spyOn(commentService, 'getAll').and.returnValue(of(comments));
    component.populateComments();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  });

});

export function MockDirective(options: Component): Directive {
  const metadata: Directive = {
    selector: options.selector,
    inputs: options.inputs,
    outputs: options.outputs
  };
  return <any>Directive(metadata)(class _ { });
}
