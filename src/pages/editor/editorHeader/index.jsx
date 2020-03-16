import React, { useState } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/react-hooks';
import ObjectID from 'utils/ObjectID';

import { Avatar } from "baseui/avatar";
import ArrowLeft from 'baseui/icon/arrow-left'
import { Button } from "baseui/button";
import { toaster, ToasterContainer, PLACEMENT } from "baseui/toast";
import s from './styles.module.scss';
import gql from 'graphql-tag';

const PUBLISH_DRAFT = gql`
  mutation publishDraft(
    $_id: ID!
  ) {
    publishDraft(
      _id: $_id
    ) {
      _id
      drafts {
        _id
        title
        content
        cover
        originalPost
        date
      }
      posts {
        _id
        title
        content
        cover
        date
      }
    }
  }
`
const EDIT_POST = gql`
  mutation editPost(
    $postId: ID!
    $draftId: ID!
  ) {
    editPost(
      postId: $postId
      draftId: $draftId
    ) {
      _id
      drafts {
        _id
        title
        content
        cover
        date
        originalPost
      }
    }
  }
`
const UPDATE_POST = gql`
  mutation updatePost(
    $originalPost: ID!
    $draftId: ID!
    $title: String
    $content: String
    $cover: String
  ) {
    updatePost(
      originalPost: $originalPost
      draftId: $draftId
      title: $title
      content: $content
      cover: $cover
    ) {
      _id
      drafts {
        _id
        title
        content
        cover
        date
      }
      posts {
        _id
        title
        content
        cover
        date
      }
    }
  }
`
const GET_DRAFT_AUTHOR = gql`
  query draftAuthor($_id: ID!) {
    draft(_id: $_id) {
      _id
      title
      content
      cover
      originalPost
      author {
        _id
        email
        name
        avatar
      }
    }
  }
`
const GET_POST_AUTHOR = gql`
  query postAuthor($_id: ID!) {
    post(_id: $_id) {
      _id
      author {
        _id
        name
        email
        avatar
      }
    }
  }
`
const GET_LOGGED_USER = gql`
  query getLoggedUser {
    me {
      _id
    }
  }
`

const EditorHeader = ({ match, history }) => {
  const [ isAuthor, setIsAuthor ] = useState(false);
  const [ author, setAuthor ] = useState(null);

  const [ publishDraft, { loading: publishDraftLoading } ] = useMutation(PUBLISH_DRAFT);
  const [ updatePost, { loading: updatePostLoading } ] = useMutation(UPDATE_POST);
  const [ editPost, { loading: editPostLoading } ] = useMutation(EDIT_POST);

  const [ getDraftAuthor, { data: draft } ] = useLazyQuery(GET_DRAFT_AUTHOR, {
    onCompleted({ draft }) {
      if (draft) {
        setAuthor(draft.author);
        setIsAuthor(draft.author._id === loggedUser.me._id);
      }
    },
  });
  const [ getPostAuthor ] = useLazyQuery(GET_POST_AUTHOR, {
    onCompleted({ post }) {
      if (post) {
        setAuthor(post.author);
        if (loggedUser && loggedUser.me) {
          setIsAuthor(post.author._id === loggedUser.me._id);
        }
      }
    },
  });
  const { data: loggedUser } = useQuery(GET_LOGGED_USER, {
    onCompleted() {
      if (match.path === '/editor/post/:id' || match.path === '/post/:id') {
        getPostAuthor({ variables: {
          _id: match.params.id,
        }})
      }
      if (match.path === '/editor/draft/:id') {
        getDraftAuthor({ variables: {
          _id: match.params.id,
        }})
      }
    }, 
    onError() {
      if (match.path === '/editor/post/:id' || match.path === '/post/:id') {
        getPostAuthor({ variables: {
          _id: match.params.id,
        }})
      }
    }
  });

  const handlePublish = async () => {
    try {
      await publishDraft({ variables: { _id: match.params.id } });
      history.push(`/editor/post/${match.params.id}`)
    } catch (error) {
      toaster.negative(error.message)
    }
  }

  const handleUpdate = async () => {
    try {
      await updatePost({ variables: { 
        originalPost: draft.draft.originalPost,
        draftId: draft.draft._id,
        title: draft.draft.title,
        content: draft.draft.content,
        cover: draft.draft.cover,
      } })

      history.push(`/editor/post/${draft.draft.originalPost}`)
    } catch (error) {
      toaster.negative(error.message)
    }
  }

  const handleEdit = async () => {
    try {
      const draftId = ObjectID();
      await editPost({ variables: { postId: match.params.id, draftId } });

      history.push(`/editor/draft/${draftId}`)
    } catch (error) {
      toaster.negative(error.message)
    }
  }

  return (
    <ToasterContainer placement={PLACEMENT.bottomRight} >
      <div className={s.container}>
        <div className={s.left}>
          <div className={s.back} onClick={() => {
            if (match.path === '/editor/post/:id') {
              history.push('/editor')
            } else history.goBack();
          }}>
            <ArrowLeft size={50}/>
          </div>
          {author &&
            <div className={s.author}>
              <Avatar size={'50px'} name={author.name} src={author.avatar} />
              <div className={s.name}>{author.name}</div>
            </div>
          }
        </div>
        {isAuthor && (match.path === "/editor/draft/:id" ? 
          (!draft.draft.originalPost ?
            <Button
              onClick={handlePublish}
              overrides={{
                BaseButton: {
                  style: buttonStyle
                }
              }}
              isLoading={publishDraftLoading}
            >
              Publish
            </Button> :
            <Button
              onClick={handleUpdate}
              overrides={{
                BaseButton: {
                  style: buttonStyle
                }
              }}
              isLoading={updatePostLoading}
            >
              Update
            </Button>
          ) : 
          <Button
            onClick={handleEdit}
            overrides={{
              BaseButton: {
                style: buttonStyle
              }
            }}
            isLoading={editPostLoading}
          >
            Edit
          </Button>
        )}
      </div> 
    </ToasterContainer>
  )
}

const buttonStyle = {
  height: '30px',
  paddingTop: '5px',
  paddingRight: '10px',
  paddingBottom: '5px',
  paddingLeft: '10px',
}

export default EditorHeader;
