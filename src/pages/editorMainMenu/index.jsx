import React, { useState, useEffect } from 'react';
import gql from 'graphql-tag';
import { useQuery, useMutation } from '@apollo/react-hooks';
import cx from 'classnames';
import moment from 'moment';
import ObjectID from 'utils/ObjectID';

import { toaster, ToasterContainer, PLACEMENT } from "baseui/toast";
import { Spinner } from "baseui/spinner";
import DeleteAlt from 'baseui/icon/delete-alt'
import HeaderBar from 'components/headerBar';
import s from './styles.module.scss';

const GET_USER_EDITOR = gql`
  query getUserEditor {
    me {
      _id
      posts {
        _id
        title
        content
        date
        cover
      }
      drafts {
        _id
        title
        date
        content
        cover
        originalPost
      }
    }
  }
`

const CREATE_DRAFT = gql`
  mutation CreateDraft(
    $title: String
    $content: String
    $_id: ID!
  ) {
    createDraft(
      title: $title
      content: $content
      _id: $_id
    ) {
      _id
      title
      date
    }
  }
`

const DELETE_DRAFT = gql`
  mutation deleteDraft(
    $_id: ID!
  ) {
    deleteDraft(
      _id: $_id
    ) {
      _id
      name
      email
      drafts {
        _id
      }
    }
  }
`
const DELETE_POST = gql`
  mutation deletePost(
    $_id: ID!
  ) {
    deletePost(
      _id: $_id
    ) {
      _id
      posts {
        _id
        title
        cover
        content
        date
      }
    }
  }
`

const EditorMainMenu = ({ history }) => {
  const { data, client } = useQuery(GET_USER_EDITOR, {
    onError({ message }) {
      toaster.negative(message)
    }
  });

  const [ createDraft, { loading: creatingDraft }] = useMutation(CREATE_DRAFT, {
    update(cache, { data: { createDraft } }) {
      cache.writeData({ data: {
        me: {
          ...data.me,
          drafts: data.me.drafts.concat([createDraft])
        }
      }})
    }
  })

  const [ deleteDraft ] = useMutation(DELETE_DRAFT);
  const [ deletePost ] = useMutation(DELETE_POST);

  const createPost = async () => {
    try {
      const _id = ObjectID();
      await createDraft({ variables: { _id }});

      history.push(`/editor/draft/${_id}`)
    } catch (error) {
      toaster.negative(error.message)
    }
  }

  const deleteItem = async ({ _id, isDraft }) => {
    try {
      if (isDraft) {
        client.writeData({
          data: {
            me: {
              ...data.me,
              drafts: data.me.drafts.filter(item => item._id !== _id),
            }
          }
        });

        await deleteDraft({ variables: { _id }});
      } else {
        client.writeData({
          data: {
            me: {
              ...data.me,
              posts: data.me.posts.filter(item => item._id !== _id),
            }
          }
        });

        await deletePost({ variables: { _id } });
      }
    } catch (error) {
      toaster.negative(error.message)
    }
  }

  const Post = ({ item, isDraft }) => {
    return (
      <div 
        className={s.card} 
        onClick={(e) => {
          if (!(e.target.dataset.role || e.target.localName === 'path')) {
            if (isDraft) {
              history.push(`/editor/draft/${item._id}`);
            } else {
              history.push(`/editor/post/${item._id}`);
            }
          }
        }}
        style={{
          background: `linear-gradient(0deg, rgba(41,41,41,0.9) 0%, rgba(41,41,41,0) 51%), 
          ${item.cover ? `url(${item.cover}) center no-repeat` : 'rgb(41, 41, 41)'}`,
          backgroundSize: 'cover',
        }}
      >
        <div className={s.top}>
          <div className={s.date}>{moment(item.date, 'x').format("DD-MM-YYYY")}</div>
          <div 
            className={s.delete} 
            onClick={() => deleteItem({ _id: item._id, isDraft })}
            data-role={'delete'}
          >
            <DeleteAlt data-role={'delete'}/>
          </div>
        </div>
        <h4>{item.title}</h4>
      </div>
    )
  }

  return (
    <ToasterContainer placement={PLACEMENT.bottomRight} >
      <HeaderBar />
      <div className={s.content}>
        <div className={s.postsWrapper}>
          <h3>Drafts</h3>
          { data ?
            <div className={s.posts}>
              <div onClick={createPost} className={cx({ [s.card]: true, [s.newPost]: true })}>
                {creatingDraft ? <Spinner color="#e2e2e2" size={80}/> : '+' }
              </div>
              {data.me.drafts
                .sort((a, b) => parseInt(b.date) - parseInt(a.date))
                .map((item) => <Post key={item._id} item={item} isDraft={true}/> )}
            </div> :
            <Spinner color="#e2e2e2" size={60}/>
          }
        </div>
        <div className={s.postsWrapper}>
          <h3>Posts</h3>
          { data ?
            <div className={s.posts}>
              { data.me.posts ?
                data.me.posts
                  .sort((a, b) => parseInt(b.date) - parseInt(a.date))
                  .map((item) => <Post key={item._id} item={item} isDraft={false}/> ) :
                <div>You have not posted yet.</div>
              }
            </div> :
            <Spinner color="#e2e2e2" size={60}/>
          }
        </div>
      </div>
    </ToasterContainer>
  )
}

export default EditorMainMenu;
